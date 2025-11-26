using Microsoft.AspNetCore.Mvc;
using NaviSafe.Data;
using NaviSafe.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace NaviSafe.Controllers;

public class ObstacleController : Controller
{
    
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ObstacleController> _logger;
    
    public ObstacleController(ApplicationDbContext db, ILogger<ObstacleController> logger)
    {
        _db = db;
        _logger = logger;
    }
    
    [HttpGet]
    public ActionResult DataForm()
    {
        return View(new ObstacleDataForm());
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DataForm(NaviSafe.Models.ObstacleDataForm model, string? submitAction)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("DataForm modelstate invalid: {Errors}", string.Join("; ",
                ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            return View(model);
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

        // Handle image upload
        byte[]? imageBytes = null;
        if (model.ImageFile != null && model.ImageFile.Length > 0)
        {
            try
            {
                using var ms = new MemoryStream();
                await model.ImageFile.CopyToAsync(ms);
                imageBytes = ms.ToArray();
                
                _logger.LogInformation("Image uploaded successfully. Size: {Size} bytes, Type: {ContentType}", 
                    imageBytes.Length, model.ImageFile.ContentType);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to read uploaded image");
                ModelState.AddModelError(string.Empty, "Failed to read uploaded image.");
                return View(model);
            }
        }

        var entity = new NaviSafe.Data.ObstacleData()
        {
            regID = null,
            ShortDesc = model.shortDesc,
            LongDesc = string.IsNullOrWhiteSpace(model.longDesc) ? null : model.longDesc,
            Lat = model.lat.Value,
            Lon = model.lon.Value,
            Altitude = model.altitude.HasValue ? model.altitude.Value : 0,

            // Required DB columns
            IsSent = isSent,
            State = "PENDING",
            UserID = userId,
            Accuracy = null,
            Img = imageBytes, // Save the uploaded image bytes
            GeoJSON = model.geoJSON
        };

        _db.Obstacles.Add(entity);

        try
        {
            await _db.SaveChangesAsync();
            _logger.LogInformation("Obstacle saved regID={RegID} by user {UserId} with image: {HasImage}", 
                entity.regID, userId, imageBytes != null);
        }
        catch (Exception ex)
        {
            // Surface DB error on the form so you can see why it fails
            // Log full exception and show friendly error on form
            _logger.LogError(ex, "Error saving obstacle to DB for user {UserId}", userId);
            ModelState.AddModelError(string.Empty, "Database error: " + ex.Message);
            return View(model);
        }

        return RedirectToAction("Overview");
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
            geoJSON = obstacle.GeoJSON
        };

        ViewBag.EditingId = id;
        return View("DataForm", model);
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdateDraft(int id, ObstacleDataForm model, string? submitAction)
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

        obstacle.ShortDesc = model.shortDesc;
        obstacle.LongDesc = model.longDesc;
        obstacle.Lat = model.lat ?? obstacle.Lat;
        obstacle.Lon = model.lon ?? obstacle.Lon;
        obstacle.Altitude = model.altitude ?? obstacle.Altitude;
        obstacle.GeoJSON = model.geoJSON;
        obstacle.IsSent = string.Equals(submitAction, "sent", StringComparison.OrdinalIgnoreCase);

        // Handle image upload
        if (model.ImageFile != null && model.ImageFile.Length > 0)
        {
            try
            {
                using var ms = new MemoryStream();
                await model.ImageFile.CopyToAsync(ms);
                obstacle.Img = ms.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to read uploaded image");
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

        _db.Obstacles.Remove(obstacle);
        await _db.SaveChangesAsync();

        return Json(new { success = true });
    }

    /// <summary>
    /// Action to serve images stored in the database
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetImage(int id)
    {
        try
        {
            var obstacle = await _db.Obstacles.FindAsync(id);
            
            if (obstacle?.Img == null || obstacle.Img.Length == 0)
            {
                return NotFound("Image not found");
            }

            // Return the image as a file result
            // Note: You might want to store the content type in the database as well
            return File(obstacle.Img, "image/jpeg");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving image for obstacle {Id}", id);
            return StatusCode(500, "Error retrieving image");
        }
    }
}