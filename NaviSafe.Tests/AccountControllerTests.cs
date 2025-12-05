using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NaviSafe.Controllers;
using NaviSafe.Data;
using NaviSafe.Models;
using NaviSafe.Services;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Xunit;

namespace NaviSafe.Tests
{
    public class AccountControllerTests
    {
        // Lager nye DbContextOptions for hver test, med en egen in-memory database
        // Guid.NewGuid() sørger for at unikt databasenavn pr test. 
        private DbContextOptions<ApplicationDbContext> CreateNewContextOptions()
        {
            var builder = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: $"AccountControllerTests_{Guid.NewGuid():N}")
                // Ignorer transaksjons-advarselen som InMemory ikke støtter.
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning));

            return builder.Options;
        }


        // Lager en AccountController og tilhørende UserStorage og context
        //brukes som test fixture i flere tester
        private (AccountController controller, ApplicationDbContext context) CreateController()
        {
            var options  = CreateNewContextOptions();
            var context  = new ApplicationDbContext(options);
            var storage  = new UserStorage(context);
            var controller = new AccountController(storage);

            return (controller, context);
        }

        // 1) Login POST - skal returnere View når ModelState er ugyldig
        [Fact]
        public async Task LoginPost_ReturnsView_WhenModelStateIsNotValid()
        {
            // Arrange - settes opp controller+modelstate 
            var (controller, _) = CreateController();
            

            controller.ModelState.AddModelError("Email", "Required"); //legger til en feil i modelstate for å simulere ugyldig inut 

            var model = new LoginViewModel
            {
                Email    = "",
                Password = ""
            };

            // Act - kaller Login-postmetode 
            var result = await controller.Login(model, returnUrl: null);

            // Assert - forventer å få view resultat  med modellen tilbake 
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Same(model, viewResult.Model);
        }

        // 2) Login POST – skal gi ModelError når brukernavn/passord er feil
        [Fact]
        public async Task LoginPost_AddsModelError_WhenCredentialsAreNotValid()
        {
            // Arrange: setter opp controller + feil Modelstate
            var (controller, _) = CreateController();

            var model = new LoginViewModel
            {
                Email    = "blablabla@example.com",
                Password = "NotCorrect123!"
            };

            // Act - prøver å logge på med ugyldig input 
            var result = await controller.Login(model, returnUrl: null);

            // Assert - fortsatt viewresult med samme modell 
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Same(model, viewResult.Model);

            Assert.False(controller.ModelState.IsValid); //ModelSate skal inneholde feilmelding 
            Assert.True(controller.ModelState.ContainsKey(string.Empty));

            var error = controller.ModelState[string.Empty]!.Errors.Single();
            Assert.Equal("Invalid email or password.", error.ErrorMessage);
        }

        // 3) Register POST, skal gi ModelError når e-post allerede finnes
        [Fact]
        public async Task RegisterPost_AddsModelError_WhenEmailAlreadyExists()
        {
            // Arrange - oppretter en context og legger inn en bruker manuelt via userstorage. 
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            var storage = new UserStorage(context);

            var existingEmail = "admin@navisafe.com";

            // Registrer en bruker med denne e-posten først
            storage.RegisterUser(
                email:      existingEmail,
                password:   "SomePassword123!",
                firstName:  "Admin",
                lastName:   "User",
                phoneNumber:"12345678",
                orgNr:      123456,          
                roleId:     "Admin"
            );

            var controller = new AccountController(storage);

            var model = new RegisterViewModel
            {
                Email         = existingEmail,
                Password      = "RandomPassword111?",
                FirstName     = "Alex",
                LastName      = "Rambo",
                PhoneNumber   = "+47 902 39 948",
                OrgNr         = 123456,      
                RoleId        = "Admin",
            };

            // Act - prøver å registerer en bruker med samme epost. 
            var result = await controller.Register(model);

            // Assert - forventer vireResult med feil i ModelSate. 
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
}
