namespace NaviSafe.Models;

public class UserAuth
{
    public int UserId { get; set; }
    public string Username { get; set; } = "";
    public string? PassHash { get; set; }
    public string? PassSalt { get; set; }
}

public class UserInfo
{
    public int UserId { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public int OrgNr { get; set; }
    public string RoleId { get; set; } = "";
}

public class UserRole
{
    public string RoleId { get; set; } = "";
    public string RolePermissions { get; set; } = ""; // ADMIN / PILOT
    public string? PermissionsDescription { get; set; }
}

