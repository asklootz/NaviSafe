using Microsoft.AspNetCore.Mvc;
using NaviSafe.Data;
using NaviSafe.Models;

namespace NaviSafe.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly IUserStorage _userStorage;

        public AccountController(IUserStorage userStorage)
        {
            _userStorage = userStorage;
        }

        // ---- LOGIN ----
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginViewModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!_userStorage.ValidateUser(model.Email, model.Password))
                return Unauthorized(new { message = "Invalid email or password." });

            StoreUserInSession(model.Email);

            return Ok(new
            {
                message = "Login successful",
                email = model.Email
            });
        }

        // ---- REGISTER ----
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterViewModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (_userStorage.UserExists(model.Email))
                return Conflict(new { message = "An account with this email already exists." });

            var userId = _userStorage.RegisterUser(
                model.Email,
                model.Password,
                model.FullName,
                model.PhoneNumber,
                model.StreetAddress,
                model.City,
                model.PostalCode,
                model.Country
            );

            if (string.IsNullOrEmpty(userId))
                return StatusCode(500, new { message = "Registration failed. Please try again." });

            StoreUserInSession(model.Email);

            return Ok(new
            {
                message = "Registration successful",
                userId,
                email = model.Email
            });
        }

        // ---- LOGOUT ----
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return Ok(new { message = "Logged out successfully" });
        }

        // ---- HELPER ----
        private void StoreUserInSession(string email)
        {
            var userInfo = _userStorage.GetUserInfo(email);
            if (userInfo == null) return;

            HttpContext.Session.SetString("UserId", userInfo.UserId);
            HttpContext.Session.SetString("IsAuthenticated", "true");
        }
    }
}
