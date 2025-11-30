using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using NaviSafe.Models;
using Microsoft.AspNetCore.Authorization;
using NaviSafe.Data;
using Microsoft.EntityFrameworkCore;

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
        // Load obstacles with reporter info and organization name for server-side rendering
        var list = _context.Obstacles
            .Where(o => o.IsSent)
            .Select(o => new AdminReportViewModel
            {
                Report = o,
                Reporter = _context.UserInfo.FirstOrDefault(u => u.UserID == o.UserID),
                OrganizationName = _context.Organisation.Where(org => org.OrgNr == _context.UserInfo.Where(u => u.UserID == o.UserID).Select(u => u.OrgNr).FirstOrDefault()).Select(org => org.OrgName).FirstOrDefault() ?? string.Empty
            })
            .ToList();

        return View(list);
    }

    [HttpGet]
    [Authorize(Roles = "ADM")]
    public async Task<IActionResult> GetUserDetails(int userId)
    {
        try
        {
            var userInfo = await _context.UserInfo
                .Where(u => u.UserID == userId)
                .Select(u => new {
                    u.UserID,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.Phone,
                    u.OrgNr
                })
                .FirstOrDefaultAsync();

            if (userInfo == null)
            {
                return Json(new { 
                    success = false, 
                    message = "User not found",
                    userInfo = new {
                        UserID = userId,
                        FirstName = "Unknown",
                        LastName = "User",
                        Email = $"user{userId}@navisafe.com",
                        Phone = "Not available",
                        OrgNr = 0
                    }
                });
            }

            var organization = await _context.Organisation
                .Where(o => o.OrgNr == userInfo.OrgNr)
                .Select(o => o.OrgName)
                .FirstOrDefaultAsync();

            return Json(new { 
                success = true, 
                userInfo = new {
                    userInfo.UserID,
                    userInfo.FirstName,
                    userInfo.LastName,
                    userInfo.Email,
                    userInfo.Phone,
                    userInfo.OrgNr,
                    OrganizationName = organization ?? "Unknown Organization"
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user details for user {UserId}", userId);
            return Json(new { 
                success = false, 
                message = "Error retrieving user details",
                userInfo = new {
                    UserID = userId,
                    FirstName = "Unknown",
                    LastName = "User",
                    Email = $"user{userId}@navisafe.com",
                    Phone = "Not available",
                    OrgNr = 0,
                    OrganizationName = "Unknown Organization"
                }
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "ADM")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdateReportStatus(int reportId, string newStatus, string reason)
    {
        try
        {
            var report = await _context.Obstacles.FindAsync(reportId);
            if (report == null)
            {
                return Json(new { success = false, message = "Report not found" });
            }

            // Update the report status
            report.State = newStatus;
            report.RejectComment = reason;

            // Log the admin action (you might want to create an AdminActions table for this)
            _logger.LogInformation("Admin updated report {ReportId} status to {NewStatus}. Reason: {Reason}", 
                reportId, newStatus, reason);

            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Report status updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating report status for report {ReportId}", reportId);
            return Json(new { success = false, message = "An error occurred while updating the report status" });
        }
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
