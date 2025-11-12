using Microsoft.AspNetCore.Mvc;
using NaviSafe.Models;
using NaviSafe.Services;

namespace NaviSafe.Controllers;

public class AccountController : Controller
{
    private readonly UserStorage _userStorage;

    public AccountController(UserStorage userStorage)
    {
        _userStorage = userStorage;
    }
    
    // Account actions
    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;
        return View();
    }
    
    // POST: /Account/Login
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
    {
        if (!ModelState.IsValid)
            return View(model);

        if (!await _userStorage.ValidateUser(model.Email, model.Password))
        {
            ModelState.AddModelError(string.Empty, "Invalid email or password.");
            return View(model);
        }
        
        // Store user info in session
        await StoreUserInSession(model.Email);
        return RedirectToReturnUrl(returnUrl);
    }
    
    // Registration actions
    [HttpGet]
    public IActionResult Register()
    {
        return View();
    }
    
    // POST: /Account/Register
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

        var userId = await _userStorage.RegisterUser(
            model.Email, model.Password, model.FullName, 
            model.PhoneNumber, model.StreetAddress, model.City, 
            model.PostalCode, model.Country);

        if (string.IsNullOrEmpty(userId))
        {
            ModelState.AddModelError(string.Empty, "Registration failed.");
            return View(model);
        }
        
        // Store user info in session
        await StoreUserInSession(model.Email);
        return RedirectToAction("Index", "Home");
    }
    
    // Logout action
    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return RedirectToAction("Login");
    }

    // Helper methods
    private async Task StoreUserInSession(string email)
    {
        var userInfo = await _userStorage.GetUserInfo(email);
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