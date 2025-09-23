using Microsoft.AspNetCore.Mvc;
using NaviSafe.Models;

namespace NaviSafe.Controllers;

public class ObstacleController : Controller
{
    [HttpGet]
    public ActionResult DataForm()
    {
        return View();
    }

    [HttpPost]
    public ActionResult DataForm(ObstacleData obstacleData)
    {
        // Removed unused isDraft variable and logic
        return View("Overview", obstacleData);
    }
}