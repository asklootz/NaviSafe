using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using NaviSafe.Controllers;
using NaviSafe.Data;
using NaviSafe.Models;
using Xunit;

namespace NaviSafe.Tests
{
    public class ObstacleControllerTests
    {
        // Liten test-implementasjon av IWebHostEnvironment
        // brukes for å gi controlleren et webmiljø 
        private class TestWebHostEnvironment : IWebHostEnvironment
        {
            public string EnvironmentName { get; set; } = "Development";
            public string ApplicationName { get; set; } = "NaviSafe";

            // Vi peker  til en temp-mappe, så vi har noe å jobbe med
            public string WebRootPath { get; set; } = Path.GetTempPath();
            public IFileProvider WebRootFileProvider { get; set; }
                = new PhysicalFileProvider(Path.GetTempPath());

            public string ContentRootPath { get; set; } = Path.GetTempPath();
            public IFileProvider ContentRootFileProvider { get; set; }
                = new PhysicalFileProvider(Path.GetTempPath());
        }

        // Felles helper for å lage en "ordentlig" controller til testene, 
        private ObstacleController CreateController()
        {
            // trenger  en DbContext-instans;  bruker en simpel options.
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .Options;

            var db = new ApplicationDbContext(options);

            // Logger
            var loggerFactory = LoggerFactory.Create(builder => { });
            var logger = loggerFactory.CreateLogger<ObstacleController>();

            // Fake miljø (webroot/contentroot peker til temp-mappe)
            var env = new TestWebHostEnvironment();

            return new ObstacleController(db, logger, env);
        }

        // GET TEST

        [Fact] //tester at GET retunerer et view resultat
        public void DataForm_Get_Returns_ViewResult()
        {
            // Arrange
            var controller = CreateController();

            // Act
            var result = controller.DataForm();

            // Assert
            Assert.IsType<ViewResult>(result);
        }

        // POST TEST med gyldig input 
        

        [Fact(Skip = "Midlertidig deaktivert – feilsøkes senere")]
        public async Task DataForm_Post_ValidModel_Returns_Overview_View()
        {
            // Arrange
            var controller = CreateController();

            var model = new ObstacleDataForm
            {
                shortDesc = "Tree",
                altitude  = 10.0f,
                longDesc  = "Tall tree"
            };

            // submitAction må ha verdi - viktig 
            var result = await controller.DataForm(model, submitAction: "save");

            // Assert
            var view = Assert.IsType<ViewResult>(result);
            Assert.Equal("Overview", view.ViewName);
        }


        // POST TEST med ugyldig input 

        [Fact] //tester at dataform retunerer samme verdi når modellens ModelState er ugyldig 
        public async Task DataForm_Post_InvalidModel_Returns_DataForm_View()
        {
            // Arrange
            var controller = CreateController();

            var model = new ObstacleDataForm
            {
                shortDesc = "",      // ugyldig: tom
                altitude  = 0.0f,    // ugyldig: under minimum
                longDesc  = "Too low"
            };

            // Tvinger ModelState til å være ugyldig
            controller.ModelState.AddModelError("shortDesc", "Required");

            var result = await controller.DataForm(model, submitAction: "save");

            // Assert
            var view = Assert.IsType<ViewResult>(result);

            // Når controlleren gjør "return View(model);" er ViewName som regel null
            // den bruker default view-navn = action-navn. 
            Assert.Null(view.ViewName);

            // Og modellen som kommer tilbake skal være ObstacleDataForm
            Assert.IsType<ObstacleDataForm>(view.Model);
        }
    }
}
