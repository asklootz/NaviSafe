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
}