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
        // Creates new DbContextOptions for each test, with own in-memory database
        // Guid.NewGuid() handles unique database name per test
        private DbContextOptions<ApplicationDbContext> CreateNewContextOptions()
        {
            var builder = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: $"AccountControllerTests_{Guid.NewGuid():N}")
                // Ignores transaction warning which InMemory does not support
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning));

            return builder.Options;
        }


        // Creates AccountController and corresponding UserStorage and context
        // Uses as a test fixture in multiple tests
        private (AccountController controller, ApplicationDbContext context) CreateController()
        {
            var options  = CreateNewContextOptions();
            var context  = new ApplicationDbContext(options);
            var storage  = new UserStorage(context);
            var controller = new AccountController(storage);

            return (controller, context);
        }

        // 1) Login POST - will return View when ModelState is not valid
        [Fact]
        public async Task LoginPost_ReturnsView_WhenModelStateIsNotValid()
        {
            // Arrange - setup controller+modelstate 
            var (controller, _) = CreateController();
            

            controller.ModelState.AddModelError("Email", "Required"); // Adding an error in ModelState for simulating invalid input
            var model = new LoginViewModel
            {
                Email    = "",
                Password = ""
            };

            // Act - calls Login post method
            var result = await controller.Login(model, returnUrl: null);

            // Assert - expects to have viewResult with model back
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Same(model, viewResult.Model);
        }

        // 2) Login POST – should receive ModelError when username/password is wrong
        [Fact]
        public async Task LoginPost_AddsModelError_WhenCredentialsAreNotValid()
        {
            // Arrange: setup Controller + incorrect Modelstate
            var (controller, _) = CreateController();

            var model = new LoginViewModel
            {
                Email    = "blablabla@example.com",
                Password = "NotCorrect123!"
            };

            // Act - attempting to login with invalid input 
            var result = await controller.Login(model, returnUrl: null);

            // Assert - still ViewResult with same model 
            var viewResult = Assert.IsType<ViewResult>(result);
            Assert.Same(model, viewResult.Model);

            Assert.False(controller.ModelState.IsValid); // ModelSate should contain error 
            Assert.True(controller.ModelState.ContainsKey(string.Empty));

            var error = controller.ModelState[string.Empty]!.Errors.Single();
            Assert.Equal("Invalid email or password.", error.ErrorMessage);
        }

        // 3) Register POST, should give ModelError when e-mail already exist
        [Fact]
        public async Task RegisterPost_AddsModelError_WhenEmailAlreadyExists()
        {
            // Arrange - creates a Context and adding an account manually via UserStorage
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            var storage = new UserStorage(context);

            var existingEmail = "admin@navisafe.com";

            // Register an account with that particular e-mail first
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

            // Act - trying to register an account with the same e-mail 
            var result = await controller.Register(model);

            // Assert - expecting vireResult with error in ModelState 
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
