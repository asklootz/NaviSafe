using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using NaviSafe.Models;
using Microsoft.AspNetCore.Authorization;

namespace NaviSafe.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HomeController : ControllerBase
{
    private readonly ILogger<HomeController> _logger;
    private readonly IConfiguration config;

    public HomeController(ILogger<HomeController> logger, IConfiguration config)
    {
        _logger = logger;
        this.config = config;
    }

    public IActionResult Index()
    {
        return Ok();
    }

    public IActionResult Privacy()
    {
        return Ok();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return Ok(new { 
            message = "An unexpected error occurred.",
            requestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier 
        });
    }
}
