using Microsoft.AspNetCore.Mvc;
using NaviSafe.Controllers;
using NaviSafe.Models;
using Xunit;

namespace NaviSafe.Tests;

public class ObstacleControllerTests
{
    [Fact]
    public void DataForm_Get_Returns_View_Result()
    {
        var controller = new ObstacleController();
        
        var result = controller.DataForm();
        
        var viewResult = Assert.IsType<ViewResult>(result);
        Assert.Null(viewResult.ViewName);
    }

    [Fact]
    public void DataForm_Post_Returns_Overview_View_With_Same_Model()
    {
        var controller = new ObstacleController();
        var model = new ObstacleData
        {
            ObstacleName = "Tree",
            ObstacleHeight = 12.0,
            ObstacleDescription = "Humongous birch tree"
        };
        
        var result = controller.DataForm(model) as ViewResult;
        
        Assert.NotNull(result);
        Assert.Equal("Overview", result!.ViewName);
        Assert.Same(model, result.Model);
    }
}