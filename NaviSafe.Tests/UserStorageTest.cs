using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using NaviSafe.Data;
using NaviSafe.Services;
using Xunit;

namespace NaviSafe.Tests
{
    public class UserStorageTest
    {
        // Lager nye DbContextOptions for hver test, med en egen in-memory database
        private DbContextOptions<ApplicationDbContext> CreateNewContextOptions()
        {
            return new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: $"UserStorageTests_{Guid.NewGuid():N}")
                // Viktig: InMemory støtter ikke transaksjoner – vi sier "ikke kast exception, bare logg"
                .ConfigureWarnings(b => b.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;
        }

        [Fact] //tester at Userexisists finenr brukeren selv om e-post er skrevet med store eller små bostaver. 
        public void FindsUserIgnoreCase()
        {
            var options = CreateNewContextOptions();

            using (var context = new ApplicationDbContext(options))
            {
                var sut = new UserStorage(context);

                var email = $"example_{Guid.NewGuid():N}@navisafe.local";

                var password    = "password";
                var firstName   = "Lars";
                var lastName    = "Mikkel";
                var phoneNumber = "+47 974 35 165";
                var orgNr       = 123456789;
                var roleId      = "Admin";

                var userId = sut.RegisterUser(
                    email,
                    password,
                    firstName,
                    lastName,
                    phoneNumber,
                    orgNr,
                    roleId
                );

                Assert.False(string.IsNullOrWhiteSpace(userId)); //sjekker om det faktisk kom en gyldig userID
                

                Assert.True(sut.UserExists(email.ToUpperInvariant()));//userexists skal være sensitive 
                Assert.True(sut.UserExists(email.ToLowerInvariant()));
            }
        }

        [Fact] //tester om registeruser lagrer relevant informasjon og at getuserinfo kan hente den 
        public void RegisterUserStoresData()
        {
            var options = CreateNewContextOptions();

            using (var context = new ApplicationDbContext(options))
            {
                var sut = new UserStorage(context);

                var email = $"register_{Guid.NewGuid():N}@example.com";

                var password    = "Secret123";
                var firstName   = "Maren";
                var lastName    = "Bokkeli";
                var phoneNumber = "+47 998 03 403";
                var orgNr       = 987654321;
                var roleId      = "User";

                var userId = sut.RegisterUser(
                    email,
                    password,
                    firstName,
                    lastName,
                    phoneNumber,
                    orgNr,
                    roleId
                );

// Vi sjekker bare at vi fikk en gyldig id, ikke tom/null
                Assert.False(
                    string.IsNullOrWhiteSpace(userId),
                    "Expected RegisterUser to return non empty userId."
                );


                var user = sut.GetUserInfo(email); //henter ut brukeren 

                Assert.NotNull(user);
                Assert.Equal(userId,     user!.UserId);
                Assert.Equal(firstName,  user.FirstName);
                Assert.Equal(lastName,   user.LastName);
                Assert.Equal(phoneNumber,user.PhoneNumber);
                Assert.Equal(orgNr,      user.OrgNr);
                Assert.Equal(roleId,     user.RoleID);

                // RegisteredDate skal være satt til noe annet enn default(DateTime)
                Assert.NotEqual(default, user.RegisteredDate);
            }
        }

        [Fact] //tester at det ikke er mulig å registere samme epost to ganger, andre forsøk skal reutnere tomt 
        public void CannotRegisterTheSameEmailTwice()
        {
            var options = CreateNewContextOptions();

            using (var context = new ApplicationDbContext(options))
            {
                var sut = new UserStorage(context);

                var email = $"dup_{Guid.NewGuid():N}@example.com";

                var firstId = sut.RegisterUser(
                    email,
                    "blabla",
                    "Lise",
                    "Barken",
                    "+47 936 83 937",
                    555555555,
                    "User"
                );

                var secondId = sut.RegisterUser(
                    email,
                    "blabla",
                    "Lise",
                    "Barken",
                    "+47 936 83 937",
                    555555555,
                    "User"
                );

                Assert.False(string.IsNullOrWhiteSpace(firstId));// første registering skal lykkes 
                Assert.Equal(string.Empty, secondId); //andre skal feil og retunere tom id
            }
        }

        [Fact] //tester at validateusr bare returnere true når passrod er skrevet rikitg, feil passors skal gi false 
        public void ValidateUserReturnsTrueOnlyIfPasswordIsCorrect()
        {
            var options = CreateNewContextOptions();

            using (var context = new ApplicationDbContext(options))
            {
                var sut = new UserStorage(context);

                var email = $"login_{Guid.NewGuid():N}@example.com";

                var correctPassword = "correct123";
                var wrongPassword   = "wrong123";
                var firstName       = "Markus";
                var lastName        = "Lie";
                var phoneNumber     = "+47 993 19 836";
                var orgNr           = 111222333;
                var roleId          = "User";

                sut.RegisterUser(
                    email,
                    correctPassword,
                    firstName,
                    lastName,
                    phoneNumber,
                    orgNr,
                    roleId
                );

                var resultCorrect = sut.ValidateUser(email, correctPassword);
                var resultWrong   = sut.ValidateUser(email, wrongPassword);

                Assert.True(resultCorrect);
                Assert.False(resultWrong);
            }
        }
    }
}
