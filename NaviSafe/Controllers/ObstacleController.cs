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
        bool isDraft = false;
        if (obstacleData.ObstacleDescription == null)
        {
            isDraft = true;
        }
        return View("Overview", obstacleData);
    }
}