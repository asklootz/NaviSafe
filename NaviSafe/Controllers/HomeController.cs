using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using NaviSafe.Models;
using Microsoft.AspNetCore.Authorization;
using NaviSafe.Data;

namespace NaviSafe.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly IConfiguration config;
    private readonly ApplicationDbContext _context;

    public HomeController(ILogger<HomeController> logger, IConfiguration config, ApplicationDbContext context)
    {
        _logger = logger;
        this.config = config;
        _context = context;
    }

    [Authorize]
    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [Authorize(Roles = "ADM")]
    public IActionResult AdminDashboard()
    {
        var reports = _context.Obstacles.ToList();
        return View(reports);
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
