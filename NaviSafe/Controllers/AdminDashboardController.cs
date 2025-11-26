using Microsoft.AspNetCore.Mvc;

namespace NaviSafe.Controllers
{
    public class AdminDashboardController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
