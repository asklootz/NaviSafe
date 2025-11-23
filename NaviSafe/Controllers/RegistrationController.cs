using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NaviSafe.Data;
using NaviSafe.Models;
using System.Text.RegularExpressions;
using System.Text.Json;
using System.Globalization; // <-- add near top with other usings

namespace NaviSafe.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    // Replace existing GetCurrentUserId with a more robust implementation
    private int? GetCurrentUserId()
    {
        try
        {
            if (User?.Identity == null || User.Identity.IsAuthenticated == false)
                return null;

            // Try a list of common claim types where a numeric user id might be stored
            var possibleIdClaims = new[]
            {
                System.Security.Claims.ClaimTypes.NameIdentifier,
                "nameid",
                "sub",
                "userId",
                "userid",
                "user_id",
                "id",
                "Id",
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
                "unique_name"
            };

            foreach (var claimName in possibleIdClaims)
            {
                var c = User.FindFirst(claimName);
                if (c != null && int.TryParse(c.Value, out var parsedId))
                    return parsedId;
            }

            // If no numeric id claim found, try resolving by email claim (if present)
            var emailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Email) ?? User.FindFirst("email");
            if (emailClaim != null && !string.IsNullOrWhiteSpace(emailClaim.Value))
            {
                // Use DB lookup to resolve the userId for this email
                try
                {
                    using var db = CreateDbContext();
                    var user = db.UserInfo.FirstOrDefault(u => u.Email == emailClaim.Value);
                    if (user != null) return user.UserId;
                }
                catch
                {
                    // ignore DB lookup failures here and return null to allow fallback logic
                }
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    // POST api/reports/submit
    [HttpPost("submit")]
    public async Task<IActionResult> SubmitReport([FromBody] ReportRequest request)
    {
        var logger = HttpContext.RequestServices.GetService(typeof(Microsoft.Extensions.Logging.ILogger<ReportsController>)) as Microsoft.Extensions.Logging.ILogger;

        if (request == null)
            return BadRequest(new { message = "Missing payload" });

        try
        {
            using var db = CreateDbContext();

            // Resolve userId in preferred order:
            // 1) explicit ReporterId sent from frontend (if present and exists)
            // 2) authenticated user id from JWT (if present)
            // 3) lookup by ReporterEmail (if provided)
            // 4) fallback to admin/first user (as before)
            int userId = 0;

            if (request.ReporterId.HasValue && request.ReporterId.Value > 0)
            {
                var explicitUser = await db.UserInfo.FindAsync(request.ReporterId.Value);
                if (explicitUser != null)
                {
                    userId = explicitUser.UserId;
                }
            }

            if (userId == 0)
            {
                var fromToken = GetCurrentUserId();
                if (fromToken.HasValue) userId = fromToken.Value;
            }

            if (userId == 0 && !string.IsNullOrWhiteSpace(request.ReporterEmail))
            {
                var user = await db.UserInfo.FirstOrDefaultAsync(u => u.Email == request.ReporterEmail);
                if (user != null) userId = user.UserId;
            }

            // If still no user found, pick a valid fallback user to satisfy FK constraint.
            // Prefer a well-known admin account if available, otherwise the first user row.
            if (userId == 0)
            {
                var fallback = await db.UserInfo.FirstOrDefaultAsync(u => u.Email == "admin@kartverket.no")
                              ?? await db.UserInfo.OrderBy(u => u.UserId).FirstOrDefaultAsync();

                if (fallback != null)
                {
                    userId = fallback.UserId;
                    var fallbackLogger = HttpContext.RequestServices.GetService(typeof(Microsoft.Extensions.Logging.ILogger<ReportsController>)) as Microsoft.Extensions.Logging.ILogger;
                    fallbackLogger?.LogInformation("No reporter user found; assigning fallback userId {UserId} to report", userId);
                }
                else
                {
                    // No users at all in the database — fail with helpful message instead of inserting invalid FK
                    var fallbackLogger = HttpContext.RequestServices.GetService(typeof(Microsoft.Extensions.Logging.ILogger<ReportsController>)) as Microsoft.Extensions.Logging.ILogger;
                    fallbackLogger?.LogError("Cannot create report: userInfo table has no users to assign as owner.");
                    return StatusCode(500, new { message = "Server misconfiguration: no user accounts available to assign report owner." });
                }
            }

            // Convert photo DataURL -> byte[] if present
            byte[]? imgBytes = null;
            if (!string.IsNullOrWhiteSpace(request.Photo))
            {
                var m = Regex.Match(request.Photo, @"data:(?<type>.+?);base64,(?<data>.+)");
                string base64 = null;
                if (m.Success) base64 = m.Groups["data"].Value;
                else base64 = request.Photo; // maybe plain base64

                if (!string.IsNullOrWhiteSpace(base64))
                {
                    try
                    {
                        imgBytes = Convert.FromBase64String(base64);
                    }
                    catch (Exception ex)
                    {
                        // If image decoding fails, log and continue without image
                        logger?.LogWarning(ex, "Failed to decode image base64, storing without image");
                        imgBytes = null;
                    }
                }
            }

            // Parse coordinates: prefer explicit fields, fallback to geometry GeoJSON
            double latD = 0, lonD = 0;
            bool latOk = double.TryParse(request.Latitude, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out latD);
            bool lonOk = double.TryParse(request.Longitude, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out lonD);

            if ((!latOk || !lonOk) && request.Geometry != null)
            {
                // Try to read JSON structure (GeoJSON Feature or Geometry)
                try
                {
                    JsonElement root;
                    if (request.Geometry is JsonElement je) root = je;
                    else
                    {
                        var json = JsonSerializer.Serialize(request.Geometry);
                        root = JsonSerializer.Deserialize<JsonElement>(json);
                    }

                    JsonElement geomEl;
                    if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("geometry", out var g)) geomEl = g;
                    else geomEl = root;

                    if (geomEl.ValueKind == JsonValueKind.Object && geomEl.TryGetProperty("type", out var t) && geomEl.TryGetProperty("coordinates", out var coords))
                    {
                        if (coords.ValueKind == JsonValueKind.Array)
                        {
                            if (coords[0].ValueKind != JsonValueKind.Array && coords.GetArrayLength() >= 2)
                            {
                                lonOk = coords[0].TryGetDouble(out lonD);
                                latOk = coords[1].TryGetDouble(out latD);
                            }
                            else if (coords[0].ValueKind == JsonValueKind.Array && coords.GetArrayLength() > 0)
                            {
                                var first = coords[0];
                                if (first.ValueKind == JsonValueKind.Array && first.GetArrayLength() >= 2)
                                {
                                    lonOk = first[0].TryGetDouble(out lonD);
                                    latOk = first[1].TryGetDouble(out latD);
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    // log geometry parsing problem and continue
                    logger?.LogWarning(ex, "Failed to parse geometry from request");
                }
            }

            var reporting = new Reporting
            {
                Lat = (float)latD,
                Lon = (float)lonD,
                Altitude = request.Height.HasValue ? request.Height.Value : (float?)null,
                Accuracy = null,
                ShortDesc = (request.Type ?? "").Length > 50 ? (request.Type ?? "").Substring(0, 50) : request.Type,
                LongDesc = (request.Description ?? "").Length > 255 ? (request.Description ?? "").Substring(0, 255) : request.Description,
                Img = imgBytes,
                IsSent = true,
                State = "PENDING",
                RejectComment = null,
                UserID = userId,
                CreationDate = DateTime.UtcNow
            };

            db.Reporting.Add(reporting);
            await db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetReport), new { id = reporting.RegID }, new { regID = reporting.RegID });
        }
        catch (Exception ex)
        {
            // Log the full exception and return a readable 500 payload for debugging
            logger?.LogError(ex, "Unhandled error in SubmitReport");
#if DEBUG
            // In development return detailed error (adjust as needed for production)
            return StatusCode(500, new { message = "Server error while submitting report", error = ex.Message, stack = ex.ToString() });
#else
            return StatusCode(500, new { message = "Server error while submitting report" });
#endif
        }
    }

    // Optional: retrieve by id for CreatedAtAction route
    [HttpGet("{id}")]
    public async Task<IActionResult> GetReport(int id)
    {
        using var db = CreateDbContext();
        var rep = await db.Reporting.FindAsync(id);
        if (rep == null) return NotFound();
        return Ok(rep);
    }

    // New: GET api/reports
    [HttpGet]
    public async Task<IActionResult> GetAllReports()
    {
        using var db = CreateDbContext();

        var reps = await db.Reporting
            .OrderByDescending(r => r.CreationDate)
            .ToListAsync();

        var list = new List<ReportDto>();
        foreach (var r in reps)
        {
            // Try to resolve reporter info
            var user = await db.UserInfo.FindAsync(r.UserID);
            var reporterName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : null;
            var reporterEmail = user?.Email;
            var organization = user != null ? user.OrgNr.ToString(CultureInfo.InvariantCulture) : null;

            var status = r.State switch
            {
                "SENT" => "Approved",
                "REJECTED" => "Rejected",
                _ => "Pending"
            };

            var geom = new
            {
                type = "Feature",
                geometry = new
                {
                    type = "Point",
                    coordinates = new[] { (double)r.Lon, (double)r.Lat }
                },
                properties = new { }
            };

            list.Add(new ReportDto
            {
                id = r.RegID,
                type = r.ShortDesc,
                height = r.Altitude,
                description = r.LongDesc,
                geometry = geom,
                latitude = r.Lat.ToString(CultureInfo.InvariantCulture),
                longitude = r.Lon.ToString(CultureInfo.InvariantCulture),
                reporter = reporterName,
                reporterEmail = reporterEmail,
                organization = organization,
                status = status,
                reportDate = r.CreationDate.ToString("o"),
                photo = null
            });
        }

        return Ok(list);
    }

    // Create DbContext on-demand (same approach used in AuthController)
    private ApplicationDbContext CreateDbContext()
    {
        var config = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var connStr = config.GetConnectionString("mariaDatabase")
                      ?? config.GetConnectionString("DefaultConnection")
                      ?? throw new InvalidOperationException("Connection string for 'mariaDatabase' or 'DefaultConnection' is not configured.");

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseMySql(connStr, ServerVersion.AutoDetect(connStr))
            .Options;

        return new ApplicationDbContext(options);
    }

    // DTO for frontend consumption
    private class ReportDto
    {
        public int id { get; set; }
        public string? type { get; set; }
        public float? height { get; set; }
        public string? description { get; set; }
        public object? geometry { get; set; }
        public string? latitude { get; set; }
        public string? longitude { get; set; }
        public string? reporter { get; set; }
        public string? reporterEmail { get; set; }
        public string? organization { get; set; }
        public string? status { get; set; }
        public string? reportDate { get; set; }
        public string? photo { get; set; }
    }
}

// DTO expected by the endpoint (matches what the frontend will send)
public class ReportRequest
{
    public string? Type { get; set; }
    public float? Height { get; set; } // altitude / height
    public string? Description { get; set; }
    public object? Geometry { get; set; } // optional GeoJSON (will be JsonElement)
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public string? Reporter { get; set; }
    public string? ReporterEmail { get; set; }
    public int? ReporterId { get; set; } // <-- added: numeric id from frontend when logged in
    public string? Organization { get; set; }
    public string? Status { get; set; }
    public string? ReportDate { get; set; }
    public string? Photo { get; set; } // DataURL (data:image/png;base64,...)
}