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
}