using System;
using NaviSafe.Data;
using NaviSafe.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace NaviSafe.Tests;

public class UserStorageTest
{
    private DbContextOptions<ApplicationDbContext> CreateNewContextOptions()
    {
        // Create a new context options instance using an in-memory database
        return new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid():N}")
            .Options;
    }

    [Fact]
    public void FindsUserIgnoreCase()
    {
        var options = CreateNewContextOptions();

        using (var context = new ApplicationDbContext(options))
        {
            var sut = new UserStorage(context);

            var emailPrefix = "example";
            var emailDomain = "navisafe.local";
            var email = $"{emailPrefix}_{Guid.NewGuid():N}@{emailDomain}";

            var password = "password";
            var fullName = "Lars Mikkel";
            var phone = "+47 974 35 165";
            var street = "Gullveien 10";
            var city = "Oslo";
            var postal = "4629";
            var country = "Norway";

            var userId = sut.RegisterUser(
                email,
                password,
                fullName,
                phone,
                street,
                city,
                postal,
                country
            );

            Assert.False(
                string.IsNullOrWhiteSpace(userId),
                "Registration returned an empty userId - it expected a valid GUID."
            );

            Assert.True(
                sut.UserExists(email.ToUpperInvariant()),
                "Look-up with UPPER should be finding the user."
            );

            Assert.True(
                sut.UserExists(email.ToLowerInvariant()),
                "Look-up with lower should be finding the user."
            );
        }
    }

    [Fact]
    public void RegisterUserStoresData()
    {
        var options = CreateNewContextOptions();

        using (var context = new ApplicationDbContext(options))
        {
            var sut = new UserStorage(context);

            var email = $"register_{Guid.NewGuid():N}@example.com";

            var password = "Secret123";
            var fullName = "Maren Bokkeli";
            var phone = "+47 998 03 403";
            var street = "Blikksveien 20";
            var city = "Kristiansand";
            var postal = "4525";
            var country = "Norway";

            var userId = sut.RegisterUser(
                email,
                password,
                fullName,
                phone,
                street,
                city,
                postal,
                country
            );

            Assert.False(
                string.IsNullOrWhiteSpace(userId),
                "Expected RegisterUser to return non empty userId."
            );

            Assert.True(
                Guid.TryParse(userId, out _),
                "Expected userId to be a fully valid GUID string."
            );

            var user = sut.GetUserInfo(email);

            Assert.NotNull(user);
            Assert.Equal(userId, user!.UserId);
            Assert.Equal(password, user.Password);
            Assert.Equal(fullName, user.FullName);
            Assert.Equal(phone, user.PhoneNumber);
            Assert.Equal(street, user.StreetAddress);
            Assert.Equal(city, user.City);
            Assert.Equal(postal, user.PostalCode);
            Assert.Equal(country, user.Country);

            Assert.Equal(
                $"{street}, {postal} {city}, {country}",
                user.FullAddress
            );

            Assert.NotEqual(
                default,
                user.RegisteredDate
            );
        }
    }

    [Fact]
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
                "Lise Barken",
                "+47 936 83 937",
                "Bokkelibruseveien 12",
                "Kristiansund",
                "4247",
                "Norway"
            );

            var secondId = sut.RegisterUser(
                email,
                "blabla",
                "Lise Barken",
                "+47 936 83 937",
                "Bokkelibruseveien 12",
                "Kristiansund",
                "4247",
                "Norway"
            );

            Assert.False(string.IsNullOrWhiteSpace(firstId));
            Assert.Equal(string.Empty, secondId);
        }
    }

    [Fact]
    public void ValidateUserReturnsTrueOnlyIfPasswordIsCorrect()
    {
        var options = CreateNewContextOptions();

        using (var context = new ApplicationDbContext(options))
        {
            var sut = new UserStorage(context);

            var email = $"login_{Guid.NewGuid():N}@example.com";

            var correctPassword = "correct123";
            var wrongPassword   = "wrong123";
            var fullName        = "Markus Lie";
            var phone           = "+47 993 19 836";
            var street          = "Blikksveien 1";
            var city            = "Bergen";
            var postal          = "4937";
            var country         = "Norway";

            sut.RegisterUser(
                email,
                correctPassword,
                fullName,
                phone,
                street,
                city,
                postal,
                country
            );

            var resultCorrect = sut.ValidateUser(email, correctPassword);
            var resultWrong   = sut.ValidateUser(email, wrongPassword);

            Assert.True(resultCorrect);
            Assert.False(resultWrong);
        }
    }
}