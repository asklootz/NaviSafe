using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NaviSafe.Data;
using NaviSafe.Models;
using NaviSafe.Services;
using System.Security.Cryptography;

namespace NaviSafe.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Missing required fields" });

        using var db = CreateDbContext();
        if (await db.UserInfo.AnyAsync(x => x.Email == req.Email))
            return BadRequest(new { message = "Email already registered" });

        var (hash, salt) = HashPassword(req.Password);

        var userAuth = new UserAuth
        {
            Username = req.Email,
            PassHash = hash,
            PassSalt = salt
        };
        db.UserAuth.Add(userAuth);
        await db.SaveChangesAsync();

        var userInfo = new UserInfo
        {
            UserId = userAuth.UserId,
            FirstName = req.FirstName ?? string.Empty,
            LastName = req.LastName ?? string.Empty,
            Email = req.Email,
            Phone = req.Phone ?? string.Empty,
            OrgNr = req.OrgNr,
            RoleId = "PIL" // default role
        };
        db.UserInfo.Add(userInfo);
        await db.SaveChangesAsync();

        var role = await db.UserRole.FirstOrDefaultAsync(r => r.RoleId == userInfo.RoleId);
        var mappedRole = MapRole(role?.RolePermissions ?? "PILOT");
        var token = TokenService.GenerateToken(userAuth.UserId, userInfo.Email, mappedRole);

        return Ok(new AuthResponse
        {
            UserId = userAuth.UserId,
            Email = userInfo.Email,
            Name = $"{userInfo.FirstName} {userInfo.LastName}".Trim(),
            Organization = userInfo.OrgNr.ToString(),
            Role = mappedRole,
            Token = token
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Missing email or password" });

        using var db = CreateDbContext();
        var userInfo = await db.UserInfo.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (userInfo == null) return Unauthorized(new { message = "Invalid credentials" });

        var userAuth = await db.UserAuth.FirstOrDefaultAsync(a => a.UserId == userInfo.UserId);
        if (userAuth == null || string.IsNullOrEmpty(userAuth.PassHash) || string.IsNullOrEmpty(userAuth.PassSalt))
            return Unauthorized(new { message = "Invalid credentials" });

        if (!VerifyPassword(req.Password, userAuth.PassHash, userAuth.PassSalt))
            return Unauthorized(new { message = "Invalid credentials" });

        var role = await db.UserRole.FirstOrDefaultAsync(r => r.RoleId == userInfo.RoleId);
        var mappedRole = MapRole(role?.RolePermissions ?? "PILOT");
        var token = TokenService.GenerateToken(userInfo.UserId, userInfo.Email, mappedRole);

        return Ok(new AuthResponse
        {
            UserId = userInfo.UserId,
            Email = userInfo.Email,
            Name = $"{userInfo.FirstName} {userInfo.LastName}".Trim(),
            Organization = userInfo.OrgNr.ToString(),
            Role = mappedRole,
            Token = token
        });
    }

    // PBKDF2 helpers
    private static (string hash, string salt) HashPassword(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(16);
        using var pbkdf2 = new Rfc2898DeriveBytes(password, saltBytes, 100000, HashAlgorithmName.SHA256);
        var hashBytes = pbkdf2.GetBytes(32);
        return (Convert.ToBase64String(hashBytes), Convert.ToBase64String(saltBytes));
    }

    private static bool VerifyPassword(string password, string storedHash, string storedSalt)
    {
        var saltBytes = Convert.FromBase64String(storedSalt);
        using var pbkdf2 = new Rfc2898DeriveBytes(password, saltBytes, 100000, HashAlgorithmName.SHA256);
        var hashBytes = pbkdf2.GetBytes(32);
        return Convert.ToBase64String(hashBytes) == storedHash;
    }

    private static string MapRole(string dbRole) =>
        string.Equals(dbRole, "ADMIN", StringComparison.OrdinalIgnoreCase) ? "admin" : "pilot";

    // Create DbContext on-demand using the named "mariaDatabase" connection string first
    private ApplicationDbContext CreateDbContext()
    {
        var config = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var connStr = config.GetConnectionString("mariaDatabase")
                     ?? config.GetConnectionString("DefaultConnection")
                     ?? throw new InvalidOperationException("Connection string for 'mariaDatabase' or 'DefaultConnection' is not configured.");

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseMySql(connStr, ServerVersion.AutoDetect(connStr))
            .Options;

        return new ApplicationDbContext(options);
    }

    // Get JwtTokenService on-demand from configuration
    private JwtTokenService TokenService =>
        new JwtTokenService(HttpContext.RequestServices.GetRequiredService<IConfiguration>());
}

// DTOs
public class RegisterRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public int OrgNr { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class AuthResponse
{
    public int UserId { get; set; }
    public string Email { get; set; } = "";
    public string Name { get; set; } = "";
    public string Organization { get; set; } = "";
    public string Role { get; set; } = "";
    public string Token { get; set; } = "";
}
