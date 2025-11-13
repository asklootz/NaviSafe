using System;
using Xunit;
using NaviSafe.Services;

namespace NaviSafe.Tests;

public class UserStorageTest
{
    [Fact]
    public void FindUserIgnoreCase()
    {
        var sut = new  UserStorage();

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
            "Registration returned an empty userId - it expected a valdi GUID."
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