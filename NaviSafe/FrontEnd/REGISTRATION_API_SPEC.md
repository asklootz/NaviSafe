# Registration API Specification for ASP.NET Core Identity

## Overview
This document describes the registration endpoint that needs to be implemented in your ASP.NET Core backend using ASP.NET Core Identity.

## Required Endpoint

### POST /api/auth/register

Creates a new user account (pilot or admin).

#### Request Body
```json
{
  "username": "string (required, min 3 characters)",
  "email": "string (required, valid email format)",
  "password": "string (required, min 6 characters)",
  "role": "pilot | admin (required)",
  "organization": "NLA | Luftforsvaret | Politiet (required)"
}
```

#### Response (Success - 200 OK)
```json
{
  "user": {
    "id": "string (GUID)",
    "username": "string",
    "email": "string",
    "role": "pilot | admin",
    "organization": "string",
    "created_at": "ISO 8601 datetime string"
  },
  "token": "string (optional JWT token)"
}
```

#### Response (Error - 400 Bad Request)
```json
{
  "error": "string",
  "details": [
    "Username already exists",
    "Email already in use",
    "Password requirements not met"
  ]
}
```

## ASP.NET Core Identity Implementation Example

### 1. Update IdentityUser to Include Custom Fields

```csharp
public class ApplicationUser : IdentityUser
{
    public string Role { get; set; } // "pilot" or "admin"
    public string Organization { get; set; } // "NLA", "Luftforsvaret", "Politiet"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

### 2. Register Request DTO

```csharp
public class RegisterRequest
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Username { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; }

    [Required]
    [RegularExpression("^(pilot|admin)$")]
    public string Role { get; set; }

    [Required]
    [RegularExpression("^(NLA|Luftforsvaret|Politiet)$")]
    public string Organization { get; set; }
}
```

### 3. Controller Implementation

```csharp
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "Invalid input", details = ModelState.Values });
        }

        // Check if username already exists
        var existingUser = await _userManager.FindByNameAsync(request.Username);
        if (existingUser != null)
        {
            return BadRequest(new { error = "Username already exists" });
        }

        // Check if email already exists
        existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest(new { error = "Email already in use" });
        }

        // Create new user
        var user = new ApplicationUser
        {
            UserName = request.Username,
            Email = request.Email,
            Role = request.Role,
            Organization = request.Organization,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                error = "Registration failed",
                details = result.Errors.Select(e => e.Description)
            });
        }

        // Assign role claim (optional, for role-based authorization)
        await _userManager.AddClaimAsync(user, new Claim(ClaimTypes.Role, request.Role));

        // Generate JWT token (optional)
        var token = GenerateJwtToken(user);

        return Ok(new
        {
            user = new
            {
                id = user.Id,
                username = user.UserName,
                email = user.Email,
                role = user.Role,
                organization = user.Organization,
                created_at = user.CreatedAt.ToString("o")
            },
            token = token
        });
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("organization", user.Organization),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddDays(7),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

### 4. Configure Identity in Program.cs / Startup.cs

```csharp
// Add Identity services
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password settings
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 6;
    options.Password.RequiredUniqueChars = 0;

    // User settings
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Add Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });
```

### 5. Database Migration

```csharp
// In your DbContext
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Customize AspNetUsers table
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Organization).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CreatedAt).IsRequired();
        });
    }
}
```

Run migration:
```bash
dotnet ef migrations add AddCustomUserFields
dotnet ef database update
```

## Frontend Integration

The frontend registration form will call this endpoint when users submit the registration form:

```typescript
// In App.tsx
const handleRegister = async (data: RegisterData): Promise<boolean> => {
  try {
    const response = await authApi.register(data);

    // Optionally store the token
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }

    return true;
  } catch (error) {
    console.error('Registration error:', error);
    return false;
  }
};
```

## Security Considerations

1. **Password Policy**: Enforce strong password requirements in ASP.NET Core Identity configuration
2. **Email Verification**: Consider adding email confirmation before allowing login
3. **Rate Limiting**: Implement rate limiting to prevent registration spam
4. **HTTPS Only**: Always use HTTPS in production
5. **CORS**: Configure CORS to allow requests from your frontend domain
6. **Input Validation**: Validate all inputs on the server side
7. **Role-Based Access**: Use `[Authorize(Roles = "admin")]` attributes to protect admin endpoints

## Testing

Use tools like Postman or curl to test the endpoint:

```bash
curl -X POST https://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testpilot",
    "email": "pilot@test.com",
    "password": "Test123!",
    "role": "pilot",
    "organization": "NLA"
  }'
```

## Next Steps

1. Implement the registration endpoint in your ASP.NET Core backend
2. Configure ASP.NET Core Identity with the custom ApplicationUser model
3. Set up JWT authentication (optional)
4. Configure CORS to allow requests from your frontend
5. Test the endpoint with the frontend registration form
6. Consider adding email verification workflow
