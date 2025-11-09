using Microsoft.AspNetCore.Mvc;
using NaviSafe.Models;

namespace NaviSafe.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ObstacleController : ControllerBase
{
    [HttpGet]
    public ActionResult DataForm()
    {
        return Ok();
    }

    [HttpPost]
    public ActionResult DataForm(ObstacleData obstacleData)
    {
        // Removed unused isDraft variable and logic
        return Ok(obstacleData);
    }
}