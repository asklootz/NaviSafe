using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
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
    public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
    {
        if (!ModelState.IsValid)
            return View(model);

        if (!_userStorage.ValidateUser(model.Email, model.Password))
        {
            ModelState.AddModelError(string.Empty, "Invalid email or password.");
            return View(model);
        }

        var userInfo = _userStorage.GetUserInfo(model.Email);
        if (userInfo == null)
        {
            ModelState.AddModelError(string.Empty, "User not found.");
            return View(model);
        }

        // Create claims and sign in using cookie authentication
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userInfo.UserId),
            new Claim(ClaimTypes.Email, model.Email),
            new Claim(ClaimTypes.GivenName, userInfo.FullName),
            new Claim(ClaimTypes.Role, userInfo.RoleID)
        };

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        var authProperties = new AuthenticationProperties
        {
            IsPersistent = model.RememberMe
        };

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            authProperties);

        HttpContext.Session.SetString("IsAuthenticated", "true");
        HttpContext.Session.SetString("UserId", userInfo.UserId);

        return RedirectToReturnUrl(returnUrl);
    }

    [HttpGet]
    public IActionResult Register()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(RegisterViewModel model)
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
            model.FirstName,
            model.LastName,
            model.PhoneNumber,
            model.OrgNr,
            model.RoleId
        );

        if (string.IsNullOrEmpty(userId))
        {
            ModelState.AddModelError(string.Empty, "Registration failed. Please try again.");
            return View(model);
        }

        // Auto-login after successful registration using cookie auth
        var userInfo = _userStorage.GetUserInfo(model.Email);
        if (userInfo != null)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userInfo.UserId),
                new Claim(ClaimTypes.Email, model.Email),
                new Claim(ClaimTypes.GivenName, userInfo.FullName),
                new Claim(ClaimTypes.Role, userInfo.RoleID)
            };

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);

            var authProperties = new AuthenticationProperties
            {
                IsPersistent = false
            };

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                authProperties);

            HttpContext.Session.SetString("UserId", userInfo.UserId);
            HttpContext.Session.SetString("IsAuthenticated", "true");
        }

        return RedirectToAction("Index", "Home");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
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