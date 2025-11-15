using Microsoft.AspNetCore.Mvc;
using NaviSafe.Controllers;
using NaviSafe.Models;
using NaviSafe.Services;
using Xunit;

namespace NaviSafe.Tests;

public class AccountControllerTests
{
    [Fact]
    public void LoginPostReturnsViewIfModelStateIsNotValid()
    {
        var userStorage = new UserStorage();
        var controller = new AccountController(userStorage);

        controller.ModelState.AddModelError("Email", "Required");

        var model = new LoginViewModel
        {
            Email = "",
            Password = ""
        };

        var result = controller.Login(model, null);

        var viewResult = Assert.IsType<ViewResult>(result);
        Assert.Same(model, viewResult.Model);
    }
    
    
    [Fact]
    public void LoginPostWillAddModelErrorWhenCredentialsAreNotValid()
    {
        var userStorage = new UserStorage();
        var controller = new AccountController(userStorage);

        var model = new LoginViewModel
        {
            Email = "blablabla@example.com",
            Password = "NotCorrect123!"
        };

        var result = controller.Login(model, null);

        var viewResult = Assert.IsType<ViewResult>(result);
        Assert.Same(model, viewResult.Model);

        Assert.False(controller.ModelState.IsValid);
        Assert.True(controller.ModelState.ContainsKey(string.Empty));

        var error = controller.ModelState[string.Empty]!.Errors.Single();
        Assert.Equal("Invalid email or password.", error.ErrorMessage);
    }
    
    
    [Fact]
    public void RegisterPostAddAModelErrorWhenTheEmailAlreadyExists()
    {
        var userStorage = new UserStorage();
        var controller = new AccountController(userStorage);

        var model = new RegisterViewModel
        {
            Email = "admin@navisafe.com",
            Password = "RandomPassword111?",
            FullName = "Alex Rambo",
            PhoneNumber = "+47 902 39 948",
            StreetAddress = "Strømsdalen 15",
            City = "Kristiansand",
            PostalCode = "4638",
            Country = "Norway"
        };

        var result = controller.Register(model);

        var viewResult = Assert.IsType<ViewResult>(result);
        Assert.Same(model, viewResult.Model);

        Assert.False(controller.ModelState.IsValid);
        Assert.True(controller.ModelState.ContainsKey(string.Empty));

        var error = controller.ModelState[string.Empty]!.Errors.Single();
        Assert.Equal(
            "An account with this email already exists.",
            error.ErrorMessage
        );
    }
}