using Microsoft.AspNetCore.Mvc;
using NaviSafe.Models;
using NaviSafe.Services;
using Microsoft.EntityFrameworkCore;
using NaviSafe.Data;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace NaviSafe.Controllers;

// NOTE: SPA now uses /api/auth/* endpoints with JWT. This MVC controller kept for potential server-rendered flows.
public class AccountController : Controller
{
    private readonly UserStorage _userStorage;

    public AccountController(UserStorage userStorage)
    {
        _userStorage = userStorage;
    }

    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Login(LoginViewModel model, string? returnUrl = null)
    {
        if (!ModelState.IsValid)
            return View(model);

        if (!_userStorage.ValidateUser(model.Email, model.Password))
        {
            ModelState.AddModelError(string.Empty, "Invalid email or password.");
            return View(model);
        }

        // Login successful - store user in session
        StoreUserInSession(model.Email);
        
        return RedirectToReturnUrl(returnUrl);
    }

    [HttpGet]
    public IActionResult Register()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Register(RegisterViewModel model)
    {
        if (!ModelState.IsValid)
            return View(model);

        if (_userStorage.UserExists(model.Email))
        {
            ModelState.AddModelError(string.Empty, "An account with this email already exists.");
            return View(model);
        }

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
        {
            ModelState.AddModelError(string.Empty, "Registration failed. Please try again.");
            return View(model);
        }

        // Auto-login after successful registration
        StoreUserInSession(model.Email);
        
        return RedirectToAction("Index", "Home");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return RedirectToAction("Login");
    }

    // Removed: API endpoints (/api/auth/register, /api/auth/login) and hashing helpers
    // These now live in AuthController.

    // Helper methods
    private void StoreUserInSession(string email)
    {
        var userInfo = _userStorage.GetUserInfo(email);
        if (userInfo == null) return;

        HttpContext.Session.SetString("UserId", userInfo.UserId);
        HttpContext.Session.SetString("IsAuthenticated", "true");
    }

    private IActionResult RedirectToReturnUrl(string? returnUrl)
    {
        if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            return Redirect(returnUrl);
        
        return RedirectToAction("Index", "Home");
    }
}