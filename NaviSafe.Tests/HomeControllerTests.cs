using Microsoft.AspNetCore.Mvc;
using NaviSafe.Controllers;
using Xunit;

namespace NaviSafe.Tests;

public class HomeControllerTests
{
    [Fact] //tester at homecontroller index returnerer et view result. 
    public void Index_Returns_ViewResult()
    { //arrange - oppretter controller med null avhengigheter 
        var controller = new HomeController(
            logger: null!,
            config: null!,
            context: null!
        );

        var result = controller.Index(); //act - kaller index()

        Assert.IsType<ViewResult>(result); //forventer viewResultat 
    }

    [Fact] // tester at homecontroller privacy() retunerer et view resultat. 
    public void Privacy_Returns_ViewResult()
    { //arrange 
        var controller = new HomeController(
            logger: null!,
            config: null!,
            context: null!
        );

        var result = controller.Privacy(); //act

        Assert.IsType<ViewResult>(result); //assert 
    }
}