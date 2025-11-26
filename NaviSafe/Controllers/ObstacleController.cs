using Microsoft.AspNetCore.Mvc;
using NaviSafe.Data;
using NaviSafe.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
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
    // public async Task<IActionResult> DataForm(NaviSafe.Models.ObstacleDataForm model)
    // {
    //     if (!ModelState.IsValid)
    //     {
    //         return View(model);
    //     }
    //
    //     var entity = new ObstacleData()
    //     {
    //         regID = null,
    //         ShortDesc = model.shortDesc,
    //         LongDesc = model.longDesc,
    //         Lat = model.lat,
    //         Lon = model.lon,
    //         Altitude = model.altitude
    //     };
    //
    //     _db.Obstacles.Add(entity);
    //     await _db.SaveChangesAsync();
    //
    //     // Redirect or show confirmation
    //     return RedirectToAction("Index", "Home");
    // }
    public async Task<IActionResult> DataForm(NaviSafe.Models.ObstacleDataForm model)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("DataForm modelstate invalid: {Errors}", string.Join("; ",
                ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            return View(model);
        }
            // return View(model);

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
        
        var isSent = string.Equals("submitAction", "sent", StringComparison.OrdinalIgnoreCase);
        var state = isSent ? true : false;

        var entity = new ObstacleData()
        {
            regID = null,
            ShortDesc = model.shortDesc,
            LongDesc = string.IsNullOrWhiteSpace(model.longDesc) ? null : model.longDesc,
            Lat = model.lat.Value,
            Lon = model.lon.Value,
            Altitude = model.altitude.HasValue ? model.altitude.Value : 0,

            // Required DB columns
            IsSent = state,
            State = "PENDING",
            UserID = userId,
            Accuracy = null,
            Img = null,
            GeoJSON = model.geoJSON
        };

        _db.Obstacles.Add(entity);

        try
        {
            await _db.SaveChangesAsync();
            _logger.LogInformation("Obstacle saved regID={RegID} by user {UserId}", entity.regID, userId);
        }
        catch (Exception ex)
        {
            // Surface DB error on the form so you can see why it fails
            // Log full exception and show friendly error on form
            _logger.LogError(ex, "Error saving obstacle to DB for user {UserId}", userId);
            ModelState.AddModelError(string.Empty, "Database error: " + ex.Message);
            return View(model);
        }

        return RedirectToAction("Index", "Home");
    }
}