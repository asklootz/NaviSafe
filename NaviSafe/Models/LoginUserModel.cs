using Microsoft.AspNetCore.Identity;

namespace NaviSafe.Models;

public class LoginUserModel : IdentityUser
{
    public DateTime? LastLogin { get; set; }
}