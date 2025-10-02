using Microsoft.AspNetCore.Mvc;
using NaviSafe.Controllers;
using Xunit;

namespace NaviSafe.Tests;

public class HomeControllerTests
{
    [Fact]
    public void Index_Return_ViewResult()
    {
        var controller = new HomeController(logger: null!, config: null!);
        var result = controller.Index();
        Assert.IsType<ViewResult>(result);
    }

    [Fact]
    public void Privacy_Return_ViewResult()
    {
        var controller = new HomeController(null!, null!);
        var result = controller.Privacy();
        Assert.IsType<ViewResult>(result);
    }
    
}