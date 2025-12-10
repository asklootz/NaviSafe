using Microsoft.AspNetCore.Mvc;
using NaviSafe.Data;
using NaviSafe.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Newtonsoft.Json.Linq;

namespace NaviSafe.Controllers;

[Authorize]
public class ObstacleController : Controller
{
    
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ObstacleController> _logger;
    private readonly IWebHostEnvironment _env;
    
    public ObstacleController(ApplicationDbContext db, ILogger<ObstacleController> logger, IWebHostEnvironment env)
    {
        _db = db;
        _logger = logger;
        _env = env;
    }
    
    // Allowed image extensions and max size
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

    private const long MaxImageBytes = 5 * 1024 * 1024; // 5 MB

    // Validate uploaded file is an image: size, content-type, extension, and magic bytes
    private static async Task<bool> IsImageFileAsync(IFormFile file)
    {
        if (file == null) return false;
        if (file.Length == 0 || file.Length > MaxImageBytes) return false;

        if (string.IsNullOrEmpty(file.ContentType) || !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return false;

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedImageExtensions.Contains(ext)) return false;

        // Read header bytes (magic numbers)
        byte[] header = new byte[12];
        try
        {
            using var stream = file.OpenReadStream();
            var bytesRead = await stream.ReadAsync(header.AsMemory(0, header.Length));
            if (bytesRead < header.Length) return false;
            if (stream.CanSeek) stream.Position = 0; // reset for later copying
        }
        catch
        {
            return false;
        }

        // PNG: 89 50 4E 47
        if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) return true;
        // JPEG and JPG: FF D8
        if (header[0] == 0xFF && header[1] == 0xD8) return true;
        // GIF: 'G' 'I' 'F' '8'
        if (header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x38) return true;
        // WEBP: 'R' 'I' 'F' 'F' ... 'W' 'E' 'B' 'P'
        if (header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
            && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50) return true;

        return false;
    }

    // Validate GeoJSON and extract a representative coordinate (lat, lon)
    // Returns null when valid; otherwise returns an error message
    private static string? ValidateAndExtractGeoJson(string? geoJson, out double? repLat, out double? repLon)
    {
        repLat = null;
        repLon = null;
        if (string.IsNullOrWhiteSpace(geoJson)) return null;

        try
        {
            var token = JToken.Parse(geoJson);
            // Accept either a Feature or a Geometry object
            JToken geometryToken = null;

            if (token.Type == JTokenType.Object)
            {
                var obj = (JObject)token;
                var t = obj["type"]?.ToString();
                if (string.Equals(t, "Feature", StringComparison.OrdinalIgnoreCase))
                {
                    geometryToken = obj["geometry"];
                }
                else if (obj["coordinates"] != null && !string.IsNullOrEmpty(t))
                {
                    // geometry object
                    geometryToken = obj;
                }
                else
                {
                    return "Invalid GeoJSON: expected a Feature or Geometry object.";
                }
            }
            else
            {
                return "Invalid GeoJSON: unexpected JSON token.";
            }

            if (geometryToken == null || geometryToken["type"] == null) return "Invalid GeoJSON: missing geometry.";

            var geomType = geometryToken["type"]!.ToString();
            if (geomType.Equals("Point", StringComparison.OrdinalIgnoreCase))
            {
                var coords = geometryToken["coordinates"] as JArray;
                if (coords == null || coords.Count < 2) return "Invalid GeoJSON Point: coordinates missing or malformed.";
                if (!double.TryParse(coords[0].ToString(), out var lon) || !double.TryParse(coords[1].ToString(), out var lat))
                    return "Invalid GeoJSON Point: coordinates are not numbers.";

                if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return "Point coordinates out of valid range.";

                repLat = lat;
                repLon = lon;
                return null;
            }
            else if (geomType.Equals("LineString", StringComparison.OrdinalIgnoreCase))
            {
                var coords = geometryToken["coordinates"] as JArray;
                if (coords == null || coords.Count == 0) return "Invalid GeoJSON LineString: coordinates missing or empty.";

                var first = coords[0] as JArray;
                if (first == null || first.Count < 2) return "Invalid GeoJSON LineString: first coordinate malformed.";
                if (!double.TryParse(first[0].ToString(), out var lon) || !double.TryParse(first[1].ToString(), out var lat))
                    return "Invalid GeoJSON LineString: coordinates are not numbers.";

                if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return "LineString coordinates out of valid range.";

                repLat = lat;
                repLon = lon;
                return null;
            }
            else
            {
                return "Unsupported GeoJSON geometry type. Only Point and LineString are accepted.";
            }
        }
        catch (Exception ex)
        {
            return "Invalid GeoJSON: " + ex.Message;
        }
    }

    [HttpGet]
    [Authorize]
    public ActionResult DataForm()
    {
        return View(new ObstacleDataForm());
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DataForm(NaviSafe.Models.ObstacleDataForm model, string? submitAction)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("DataForm modelstate invalid: {Errors}", string.Join("; ",
                ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            return View(model);
        }

        // If geoJSON provided, validate and extract representative coordinates early
        if (!string.IsNullOrWhiteSpace(model.geoJSON))
        {
            var geoError = ValidateAndExtractGeoJson(model.geoJSON, out var repLat, out var repLon);
            if (geoError != null)
            {
                ModelState.AddModelError(string.Empty, geoError);
                _logger.LogWarning("GeoJSON validation failed: {Error}", geoError);
                return View(model);
            }

            // If lat/lon are missing, fill them from representative coordinate
            if ((!model.lat.HasValue || !model.lon.HasValue) && repLat.HasValue && repLon.HasValue)
            {
                model.lat = (float)repLat.Value;
                model.lon = (float)repLon.Value;
            }
        }

        // Resolve current user id (session or claim). Must be a valid user Id present in userInfo.
        var userIdStr = HttpContext.Session.GetString("UserId") 
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out var userId))
        {
            ModelState.AddModelError(string.Empty, "User not authenticated. Please log in.");
            _logger.LogWarning("Unable to resolve user id for submission. Session/User claims missing or invalid: {UserIdRaw}", userIdStr);
            return View(model);
        }
        
        // Ensure lat/lon present even after the Required attributes (defensive)
        if (!model.lat.HasValue || !model.lon.HasValue)
        {
            ModelState.AddModelError(string.Empty, "Coordinates missing.");
            return View(model);
        }
        
        var isSent = string.Equals(submitAction, "sent", StringComparison.OrdinalIgnoreCase);

        // Handle image upload - validate and save to wwwroot/images and store relative path in DB
        string? savedRelativePath = null;
        if (model.ImageFile != null && model.ImageFile.Length > 0)
        {
            // Validate file is an image
            if (!await IsImageFileAsync(model.ImageFile))
            {
                ModelState.AddModelError(string.Empty, "Uploaded file must be a valid image (jpg, png, gif, webp) and not exceed 5 MB.");
                return View(model);
            }

            try
            {
                var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
                var imagesFolder = Path.Combine(webRoot, "images");
                if (!Directory.Exists(imagesFolder)) Directory.CreateDirectory(imagesFolder);

                var ext = Path.GetExtension(model.ImageFile.FileName);
                if (string.IsNullOrEmpty(ext)) ext = ".jpg";

                var fileName = $"{userId}_{DateTime.Now:yyyyMMddTHHmmssfff}{ext}";
                var destPath = Path.Combine(imagesFolder, fileName);

                using (var stream = System.IO.File.Create(destPath))
                {
                    await model.ImageFile.CopyToAsync(stream);
                }

                savedRelativePath = "/images/" + fileName;

                _logger.LogInformation("Saved uploaded image to {Path} for user {UserId}", destPath, userId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to save uploaded image");
                ModelState.AddModelError(string.Empty, "Failed to save uploaded image.");
                return View(model);
            }
        }

        var entity = new NaviSafe.Data.ObstacleData()
        {
            regID = null,
            ShortDesc = model.shortDesc,
            LongDesc = string.IsNullOrEmpty(model.longDesc) ? null : model.longDesc,
            Lat = model.lat.Value,
            Lon = model.lon.Value,
            Altitude = model.altitude.HasValue ? model.altitude.Value : null,

            // Required DB columns
            IsSent = isSent,
            State = "PENDING",
            RejectComment = string.IsNullOrEmpty(model.rejectComment) ? null : model.rejectComment,
            UserID = userId,
            Accuracy = model.accuracy,
            Img = savedRelativePath, // store relative path (or null)
            GeoJSON = string.IsNullOrWhiteSpace(model.geoJSON) ? null : model.geoJSON
        };

        _db.Obstacles.Add(entity);

        try
        {
            await _db.SaveChangesAsync();
            _logger.LogInformation("Obstacle saved regID={RegID} by user {UserId} with image path: {Path}", 
                entity.regID, userId, savedRelativePath);
        }
        catch (Exception ex)
        {
            // Surface DB error on the form so you can see why it fails
            // Log full exception and show friendly error on form
            _logger.LogError(ex, "Error saving obstacle to DB for user {UserId}", userId);
            ModelState.AddModelError(string.Empty, "Database error: " + ex.Message);
            return View(model);
        }

        return RedirectToAction("Dataform");
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> Overview()
    {
        var userIdStr = HttpContext.Session.GetString("UserId") 
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!int.TryParse(userIdStr, out var userId))
        {
            return RedirectToAction("Login", "Account");
        }

        var reports = await _db.Obstacles
            .Where(o => o.UserID == userId)
            .ToListAsync();
        
        // Order in memory since CreationDate might be a computed property
        reports = reports.OrderByDescending(o => o.CreationDate).ToList();

        return View(reports);
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> EditDraft(int id)
    {
        var userIdStr = HttpContext.Session.GetString("UserId") 
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!int.TryParse(userIdStr, out var userId))
        {
            return RedirectToAction("Login", "Account");
        }

        var obstacle = await _db.Obstacles.FindAsync(id);
        
        if (obstacle == null || obstacle.UserID != userId)
        {
            return NotFound();
        }

        if (obstacle.IsSent)
        {
            return RedirectToAction("Overview");
        }

        var model = new ObstacleDataForm
        {
            shortDesc = obstacle.ShortDesc,
            longDesc = obstacle.LongDesc,
            lat = obstacle.Lat,
            lon = obstacle.Lon,
            altitude = obstacle.Altitude,
            accuracy = obstacle.Accuracy,
            geoJSON = obstacle.GeoJSON,
            ExistingImagePath = obstacle.Img
        };

        ViewBag.EditingId = id;
        return View("DataForm", model);
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdateDraft(int id, ObstacleDataForm model, string? submitAction, int radius)
    {
        var userIdStr = HttpContext.Session.GetString("UserId") 
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!int.TryParse(userIdStr, out var userId))
        {
            return RedirectToAction("Login", "Account");
        }

        if (!ModelState.IsValid)
        {
            ViewBag.EditingId = id;
            return View("DataForm", model);
        }

        var obstacle = await _db.Obstacles.FindAsync(id);
        
        if (obstacle == null || obstacle.UserID != userId || obstacle.IsSent)
        {
            return NotFound();
        }

        // If geoJSON provided, validate and extract representative coordinates
        if (!string.IsNullOrWhiteSpace(model.geoJSON))
        {
            var geoError = ValidateAndExtractGeoJson(model.geoJSON, out var repLat, out var repLon);
            if (geoError != null)
            {
                ModelState.AddModelError(string.Empty, geoError);
                _logger.LogWarning("GeoJSON validation failed while updating draft {Id}: {Error}", id, geoError);
                ViewBag.EditingId = id;
                return View("DataForm", model);
            }

            // If lat/lon are missing, fill them from representative coordinate
            if ((!model.lat.HasValue || !model.lon.HasValue) && repLat.HasValue && repLon.HasValue)
            {
                model.lat = (float)repLat.Value;
                model.lon = (float)repLon.Value;
            }
        }

        obstacle.ShortDesc = model.shortDesc;
        obstacle.LongDesc = model.longDesc;
        obstacle.Lat = model.lat ?? obstacle.Lat;
        obstacle.Lon = model.lon ?? obstacle.Lon;
        obstacle.Altitude = model.altitude ?? obstacle.Altitude;
        obstacle.Accuracy = model.accuracy ?? obstacle.Accuracy ?? radius;
        obstacle.GeoJSON = model.geoJSON;
        obstacle.IsSent = string.Equals(submitAction, "sent", StringComparison.OrdinalIgnoreCase);

        // Handle image upload - replace existing file if present
        if (model.ImageFile != null && model.ImageFile.Length > 0)
        {
            // Validate file first
            if (!await IsImageFileAsync(model.ImageFile))
            {
                ModelState.AddModelError(string.Empty, "Uploaded file must be a valid image (jpg, png, gif, webp) and not exceed 5 MB.");
                ViewBag.EditingId = id;
                return View("DataForm", model);
            }

            try
            {
                var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
                var imagesFolder = Path.Combine(webRoot, "images");
                if (!Directory.Exists(imagesFolder)) Directory.CreateDirectory(imagesFolder);

                // delete old file if exists and is within images folder
                if (!string.IsNullOrEmpty(obstacle.Img))
                {
                    try
                    {
                        var oldRel = obstacle.Img.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                        var oldPhysical = Path.Combine(webRoot, oldRel);
                        if (System.IO.File.Exists(oldPhysical)) System.IO.File.Delete(oldPhysical);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete old image while updating obstacle {Id}", id);
                    }
                }

                var ext = Path.GetExtension(model.ImageFile.FileName);
                if (string.IsNullOrEmpty(ext)) ext = ".jpg";

                var fileName = $"{userId}_{DateTime.Now:yyyyMMddTHHmmssfff}{ext}";
                var destPath = Path.Combine(imagesFolder, fileName);

                using (var stream = System.IO.File.Create(destPath))
                {
                    await model.ImageFile.CopyToAsync(stream);
                }

                obstacle.Img = "/images/" + fileName;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to save uploaded image while updating");
            }
        }

        await _db.SaveChangesAsync();
        return RedirectToAction("Overview");
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteDraft(int id)
    {
        var userIdStr = HttpContext.Session.GetString("UserId") 
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!int.TryParse(userIdStr, out var userId))
        {
            return Json(new { success = false, message = "Not authenticated" });
        }

        var obstacle = await _db.Obstacles.FindAsync(id);
        
        if (obstacle == null || obstacle.UserID != userId || obstacle.IsSent)
        {
            return Json(new { success = false, message = "Cannot delete this report" });
        }

        // delete file if present
        if (!string.IsNullOrEmpty(obstacle.Img))
        {
            try
            {
                var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
                var rel = obstacle.Img.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                var phys = Path.Combine(webRoot, rel);
                if (System.IO.File.Exists(phys)) System.IO.File.Delete(phys);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete image file for obstacle {Id}", id);
            }
        }

        _db.Obstacles.Remove(obstacle);
        await _db.SaveChangesAsync();

        return Json(new { success = true });
    }


    // Serve image by redirecting to its stored relative path so static file middleware handles delivery
    [HttpGet]
    public async Task<IActionResult> GetImage(int id)
    {
        try
        {
            var obstacle = await _db.Obstacles.FindAsync(id);
            if (obstacle == null || string.IsNullOrEmpty(obstacle.Img))
                return NotFound("Image not found");

            // obstacle.Img contains a relative path such as "/images/123_20251118T153000.jpg"
            return Redirect(obstacle.Img);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving image for obstacle {Id}", id);
            return StatusCode(500, "Error retrieving image");
        }
    }
}