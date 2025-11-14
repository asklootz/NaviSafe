# MariaDB Integration Guide for NaviSafe
## Connecting Your Existing Database to React Frontend

This guide will help you connect your existing MariaDB database (userInfo, userAuth, userRole, organisation, registrations) to the NaviSafe React frontend.

---

## Step 1: Understanding Your Database Structure

### Your Existing Tables:
- `userInfo` - User profile information
- `userAuth` - Authentication credentials
- `userRole` - User roles (pilot/admin)
- `organisation` - Organizations (NLA, Luftforsvaret, Politiet)
- `registrations` - Obstacle reports/registrations

### Frontend Expectations:
The React app expects these data structures (from `/lib/types.ts`):
- **User**: `{ id, username, email, role, organization, created_at }`
- **ObstacleReport**: `{ id, reporter_id, obstacle_type, geometry, status, ... }`

---

## Step 2: Database Schema Mapping

You need to create views or map your existing tables to match the frontend expectations:

### Option A: Create Database Views (Recommended)

```sql
-- Create a unified User view
CREATE OR REPLACE VIEW vw_Users AS
SELECT 
    ui.userId as id,
    ua.username as username,
    ui.email as email,
    ur.roleName as role,  -- should be 'pilot' or 'admin'
    o.organisationName as organization,
    ui.createdAt as created_at
FROM userInfo ui
INNER JOIN userAuth ua ON ui.userId = ua.userId
INNER JOIN userRole ur ON ui.roleId = ur.roleId
LEFT JOIN organisation o ON ui.organisationId = o.organisationId;

-- Create an ObstacleReports view
CREATE OR REPLACE VIEW vw_ObstacleReports AS
SELECT 
    r.registrationId as id,
    r.reporterId as reporter_id,
    CONCAT(ui.firstName, ' ', ui.lastName) as reporter_name,
    o.organisationName as organization,
    r.obstacleType as obstacle_type,
    r.geometryType as geometry_type,
    r.geometry as geometry,  -- Should be JSON format
    r.heightMeters as height_meters,
    r.description as description,
    r.comments as comments,
    r.photoUrl as photo_url,
    r.status as status,  -- 'Draft', 'Submitted', or 'Approved'
    r.createdAt as created_at,
    r.updatedAt as updated_at,
    r.reporterPosition as reporter_position,
    r.reporterPositionAccuracy as reporter_position_accuracy
FROM registrations r
INNER JOIN userInfo ui ON r.reporterId = ui.userId
LEFT JOIN organisation o ON ui.organisationId = o.organisationId;
```

### Option B: Adjust Your C# DTOs

Create Data Transfer Objects (DTOs) in your C# backend that transform database entities to frontend format.

---

## Step 3: Verify GeoJSON Storage in MariaDB

Your `registrations.geometry` column must store GeoJSON format. Check if it's stored as:

### Current Format Check:
```sql
SELECT geometry, geometryType FROM registrations LIMIT 1;
```

### Expected Format (JSON):

**Point:**
```json
{
  "type": "Point",
  "coordinates": [7.9956, 58.1467]
}
```

**LineString:**
```json
{
  "type": "LineString",
  "coordinates": [
    [7.9956, 58.1467],
    [7.9960, 58.1470]
  ]
}
```

### If you need to add the geometry column:
```sql
ALTER TABLE registrations 
ADD COLUMN geometry JSON,
ADD COLUMN geometryType VARCHAR(20);

-- Add spatial index for performance (optional but recommended)
ALTER TABLE registrations ADD SPATIAL INDEX idx_geometry(geometry);
```

---

## Step 4: C# Backend API Implementation

Create these controllers in your ASP.NET Core backend:

### 4.1 AuthController.cs

```csharp
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly string _connectionString;

    public AuthController(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync();

        // Query using your database views
        var query = @"
            SELECT id, username, email, role, organization, created_at 
            FROM vw_Users 
            WHERE username = @username";

        using var command = new MySqlCommand(query, connection);
        command.Parameters.AddWithValue("@username", dto.Username);

        using var reader = await command.ExecuteReaderAsync();
        
        if (await reader.ReadAsync())
        {
            // TODO: Verify password hash from userAuth table
            // For now, returning user data
            
            var user = new
            {
                id = reader["id"].ToString(),
                username = reader["username"].ToString(),
                email = reader["email"].ToString(),
                role = reader["role"].ToString(),
                organization = reader["organization"].ToString(),
                created_at = reader["created_at"].ToString()
            };

            // TODO: Generate JWT token
            return Ok(new { user, token = "your-jwt-token" });
        }

        return Unauthorized(new { message = "Invalid credentials" });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Clear session/cookies
        return Ok();
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        // TODO: Get user from JWT token
        // Return current user data
        return Ok();
    }
}

public class LoginDto
{
    public string Username { get; set; }
    public string Password { get; set; }
}
```

### 4.2 ReportsController.cs

```csharp
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using Newtonsoft.Json;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly string _connectionString;

    public ReportsController(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
    }

    [HttpGet]
    public async Task<IActionResult> GetReports(
        [FromQuery] string status = null,
        [FromQuery] string reporter_id = null,
        [FromQuery] string obstacle_type = null)
    {
        using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM vw_ObstacleReports WHERE 1=1";
        
        if (!string.IsNullOrEmpty(status))
            query += " AND status = @status";
        if (!string.IsNullOrEmpty(reporter_id))
            query += " AND reporter_id = @reporter_id";
        if (!string.IsNullOrEmpty(obstacle_type))
            query += " AND obstacle_type = @obstacle_type";

        using var command = new MySqlCommand(query, connection);
        if (!string.IsNullOrEmpty(status))
            command.Parameters.AddWithValue("@status", status);
        if (!string.IsNullOrEmpty(reporter_id))
            command.Parameters.AddWithValue("@reporter_id", reporter_id);
        if (!string.IsNullOrEmpty(obstacle_type))
            command.Parameters.AddWithValue("@obstacle_type", obstacle_type);

        var reports = new List<object>();
        using var reader = await command.ExecuteReaderAsync();
        
        while (await reader.ReadAsync())
        {
            reports.Add(MapReportFromReader(reader));
        }

        return Ok(reports);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetReport(string id)
    {
        using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM vw_ObstacleReports WHERE id = @id";
        using var command = new MySqlCommand(query, connection);
        command.Parameters.AddWithValue("@id", id);

        using var reader = await command.ExecuteReaderAsync();
        
        if (await reader.ReadAsync())
        {
            return Ok(MapReportFromReader(reader));
        }

        return NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> CreateReport([FromForm] CreateReportDto dto)
    {
        using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync();

        var reportId = Guid.NewGuid().ToString();
        var photoUrl = "";

        // Handle photo upload
        if (dto.Photo != null)
        {
            var uploadsFolder = Path.Combine("wwwroot", "uploads");
            Directory.CreateDirectory(uploadsFolder);
            
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(dto.Photo.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);
            
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await dto.Photo.CopyToAsync(stream);
            }
            
            photoUrl = $"/uploads/{fileName}";
        }

        // TODO: Get reporter info from authenticated user
        var reporterId = "current-user-id"; // Get from JWT token
        var reporterName = "Current User"; // Get from database

        var query = @"
            INSERT INTO registrations (
                registrationId, reporterId, obstacleType, geometryType, 
                geometry, heightMeters, description, comments, 
                photoUrl, status, createdAt, updatedAt
            ) VALUES (
                @id, @reporterId, @obstacleType, @geometryType,
                @geometry, @heightMeters, @description, @comments,
                @photoUrl, @status, NOW(), NOW()
            )";

        using var command = new MySqlCommand(query, connection);
        command.Parameters.AddWithValue("@id", reportId);
        command.Parameters.AddWithValue("@reporterId", reporterId);
        command.Parameters.AddWithValue("@obstacleType", dto.ObstacleType);
        command.Parameters.AddWithValue("@geometryType", dto.GeometryType);
        command.Parameters.AddWithValue("@geometry", dto.Geometry);
        command.Parameters.AddWithValue("@heightMeters", dto.HeightMeters ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@description", dto.Description ?? "");
        command.Parameters.AddWithValue("@comments", dto.Comments ?? "");
        command.Parameters.AddWithValue("@photoUrl", photoUrl);
        command.Parameters.AddWithValue("@status", dto.Status);

        await command.ExecuteNonQueryAsync();

        // Return the created report
        return await GetReport(reportId);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateReport(string id, [FromForm] UpdateReportDto dto)
    {
        // Similar to CreateReport, but UPDATE query
        // TODO: Implement update logic
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReport(string id)
    {
        using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM registrations WHERE registrationId = @id";
        using var command = new MySqlCommand(query, connection);
        command.Parameters.AddWithValue("@id", id);

        await command.ExecuteNonQueryAsync();
        return Ok();
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveReport(string id)
    {
        using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "UPDATE registrations SET status = 'Approved', updatedAt = NOW() WHERE registrationId = @id";
        using var command = new MySqlCommand(query, connection);
        command.Parameters.AddWithValue("@id", id);

        await command.ExecuteNonQueryAsync();
        return await GetReport(id);
    }

    [HttpGet("geojson")]
    public async Task<IActionResult> GetGeoJSON()
    {
        using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM vw_ObstacleReports WHERE status = 'Approved'";
        using var command = new MySqlCommand(query, connection);

        var features = new List<object>();
        using var reader = await command.ExecuteReaderAsync();
        
        while (await reader.ReadAsync())
        {
            var report = MapReportFromReader(reader);
            features.Add(new
            {
                type = "Feature",
                geometry = JsonConvert.DeserializeObject(reader["geometry"].ToString()),
                properties = report
            });
        }

        return Ok(new
        {
            type = "FeatureCollection",
            features
        });
    }

    private object MapReportFromReader(MySqlDataReader reader)
    {
        return new
        {
            id = reader["id"].ToString(),
            reporter_id = reader["reporter_id"].ToString(),
            reporter_name = reader["reporter_name"].ToString(),
            organization = reader["organization"]?.ToString(),
            obstacle_type = reader["obstacle_type"].ToString(),
            geometry_type = reader["geometry_type"].ToString(),
            geometry = JsonConvert.DeserializeObject(reader["geometry"].ToString()),
            height_meters = reader["height_meters"] != DBNull.Value ? Convert.ToDouble(reader["height_meters"]) : (double?)null,
            description = reader["description"]?.ToString(),
            comments = reader["comments"]?.ToString(),
            photo_url = reader["photo_url"]?.ToString(),
            status = reader["status"].ToString(),
            created_at = reader["created_at"].ToString(),
            updated_at = reader["updated_at"].ToString()
        };
    }
}

public class CreateReportDto
{
    public string ObstacleType { get; set; }
    public string GeometryType { get; set; }
    public string Geometry { get; set; } // JSON string
    public double? HeightMeters { get; set; }
    public string Description { get; set; }
    public string Comments { get; set; }
    public string Status { get; set; }
    public IFormFile Photo { get; set; }
}

public class UpdateReportDto : CreateReportDto { }
```

---

## Step 5: Configure Your ASP.NET Core Backend

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=navisafe;User=root;Password=yourpassword;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Program.cs (or Startup.cs)
```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("NaviSafePolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles(); // For serving uploaded images
app.UseCors("NaviSafePolicy");
app.UseAuthorization();
app.MapControllers();

app.Run();
```

---

## Step 6: Install Required NuGet Packages

```bash
dotnet add package MySql.Data
dotnet add package Newtonsoft.Json
dotnet add package Microsoft.AspNetCore.Mvc
```

---

## Step 7: Update Frontend Configuration

Create `.env` file in your React project root:

```bash
REACT_APP_API_URL=http://localhost:5000/api
```

The frontend is already configured to use this in `/lib/api.ts`.

---

## Step 8: Test the Connection

### 1. Start MariaDB
```bash
# Make sure your MariaDB is running
mysql -u root -p
USE navisafe;
SHOW TABLES;
```

### 2. Start C# Backend
```bash
cd YourBackendProject
dotnet run
```

Backend should start on `https://localhost:5001` or `http://localhost:5000`

### 3. Start React Frontend
```bash
npm run dev
```

Frontend should start on `http://localhost:3000` or `http://localhost:5173`

### 4. Test Login
Open browser and go to `http://localhost:3000`
- Try logging in with a user from your `userAuth` table
- Check browser DevTools > Network tab to see API calls

---

## Step 9: Security Considerations

### Password Hashing
Your `userAuth` table should store hashed passwords:

```csharp
using System.Security.Cryptography;
using System.Text;

public class PasswordHasher
{
    public static string HashPassword(string password)
    {
        using (var sha256 = SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    public static bool VerifyPassword(string password, string hash)
    {
        var hashOfInput = HashPassword(password);
        return hashOfInput == hash;
    }
}
```

### JWT Authentication (Recommended)
```bash
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package System.IdentityModel.Tokens.Jwt
```

See full JWT implementation in `/guidelines/Backend-Integration.md`

---

## Step 10: Troubleshooting

### Common Issues:

1. **CORS Error**
   - Make sure CORS policy includes your frontend URL
   - Check that `app.UseCors()` is called before `app.UseAuthorization()`

2. **Database Connection Failed**
   - Verify connection string in `appsettings.json`
   - Check that MariaDB is running: `systemctl status mariadb`

3. **GeoJSON Format Error**
   - Ensure geometry column stores valid JSON
   - Test with: `SELECT JSON_VALID(geometry) FROM registrations;`

4. **Image Upload Fails**
   - Create `wwwroot/uploads` folder
   - Set proper permissions: `chmod 755 wwwroot/uploads`

5. **API Returns 404**
   - Check that controllers are in correct namespace
   - Verify routes: `[Route("api/[controller]")]`

---

## Next Steps

✅ **You have:**
- MariaDB database with existing structure
- React frontend ready for integration
- This integration guide

⚠️ **You need to:**
1. Create database views (`vw_Users`, `vw_ObstacleReports`)
2. Implement C# controllers (Auth, Reports)
3. Configure CORS and connection strings
4. Test login and report creation
5. Implement JWT authentication
6. Add password hashing
7. Deploy to Docker

---

## Docker Deployment

Once everything works locally, deploy with Docker:

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://backend:5000/api
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - ConnectionStrings__DefaultConnection=Server=db;Database=navisafe;User=root;Password=yourpassword
    depends_on:
      - db

  db:
    image: mariadb:latest
    environment:
      - MYSQL_ROOT_PASSWORD=yourpassword
      - MYSQL_DATABASE=navisafe
    ports:
      - "3306:3306"
    volumes:
      - mariadb-data:/var/lib/mysql

volumes:
  mariadb-data:
```

---

## Support & Resources

- **Frontend Code**: Check `/lib/api.ts` for expected API format
- **Types**: See `/lib/types.ts` for data structures
- **Mock Data**: Review `/lib/mockData.ts` for example data
- **ASP.NET Docs**: https://docs.microsoft.com/en-us/aspnet/core/
- **MariaDB + GeoJSON**: https://mariadb.com/kb/en/json-data-type/

For questions, refer to the original `/guidelines/Backend-Integration.md` file.
