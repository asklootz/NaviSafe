# Backend Integration Guide - NaviSafe

## Overview
This React frontend is designed to integrate with your ASP.NET Core MVC backend using MariaDB/MySQL.

## Technology Stack Compatibility

### Frontend (Current)
- ✅ **React** with TypeScript
- ✅ **Leaflet** for maps (with OpenStreetMap tiles)
- ✅ **GeoJSON** for geometry (WGS84 coordinates)
- ✅ **Tailwind CSS** for styling
- ✅ **ShadCN UI** components

### Backend (Your Stack)
- ✅ **ASP.NET Core** MVC
- ✅ **MariaDB/MySQL** database
- ✅ **Docker** for deployment
- ✅ **REST API** endpoints

## Required ASP.NET Core API Endpoints

### 1. Authentication Endpoints

```csharp
// POST /api/auth/login
// Request: { username: string, password: string }
// Response: { user: User, token?: string }

// POST /api/auth/logout
// Response: 200 OK

// GET /api/auth/me
// Response: User object
```

### 2. Reports Endpoints

```csharp
// GET /api/reports
// Query params: ?status=Submitted&reporter_id=xxx&obstacle_type=Tower
// Response: ObstacleReport[]

// GET /api/reports/{id}
// Response: ObstacleReport

// POST /api/reports
// Request: ObstacleReport (with FormData if photo included)
// Response: ObstacleReport

// PUT /api/reports/{id}
// Request: Partial<ObstacleReport>
// Response: ObstacleReport

// DELETE /api/reports/{id}
// Response: 200 OK

// POST /api/reports/{id}/approve (Admin only)
// Response: ObstacleReport

// POST /api/reports/{id}/merge (Admin only)
// Request: { duplicate_ids: string[] }
// Response: ObstacleReport

// GET /api/reports/geojson
// Response: GeoJSON FeatureCollection
```

### 3. Duplicate Detection Endpoint

```csharp
// POST /api/duplicates/find
// Request: { geometry: GeoJSONGeometry }
// Response: ObstacleReport[]
```

## Database Schema (MariaDB/MySQL)

### Users Table
```sql
CREATE TABLE Users (
    Id VARCHAR(36) PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL, -- Hashed
    Organization VARCHAR(200),
    Role VARCHAR(20) NOT NULL, -- 'pilot' or 'admin'
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### ObstacleReports Table
```sql
CREATE TABLE ObstacleReports (
    Id VARCHAR(36) PRIMARY KEY,
    ReporterId VARCHAR(36) NOT NULL,
    ReporterName VARCHAR(100) NOT NULL,
    Organization VARCHAR(200),
    ObstacleType VARCHAR(50) NOT NULL, -- 'Tower', 'Power Line', 'Wind Turbine', 'Building', 'Other'
    GeometryType VARCHAR(20) NOT NULL, -- 'Point' or 'LineString'
    Geometry JSON NOT NULL, -- GeoJSON geometry object
    HeightMeters DECIMAL(10,2),
    Description TEXT,
    Comments TEXT,
    PhotoUrl VARCHAR(500),
    Status VARCHAR(20) NOT NULL, -- 'Draft', 'Submitted', 'Approved'
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ReporterId) REFERENCES Users(Id),
    SPATIAL INDEX(Geometry) -- For geospatial queries
);
```

## GeoJSON Format (WGS84)

### Point Geometry
```json
{
  "type": "Point",
  "coordinates": [7.9956, 58.1467] // [longitude, latitude]
}
```

### LineString Geometry
```json
{
  "type": "LineString",
  "coordinates": [
    [7.9956, 58.1467],
    [7.9960, 58.1470],
    [7.9965, 58.1475]
  ]
}
```

## CORS Configuration (ASP.NET Core)

Add this to your `Startup.cs` or `Program.cs`:

```csharp
services.AddCors(options =>
{
    options.AddPolicy("NaviSafePolicy", builder =>
    {
        builder.WithOrigins("http://localhost:3000", "https://your-frontend-url.com")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

app.UseCors("NaviSafePolicy");
```

## Environment Variables

Create `.env` file in frontend root:

```bash
REACT_APP_API_URL=https://localhost:5001/api
```

## File Upload Configuration

For photo uploads, configure ASP.NET Core to accept multipart/form-data:

```csharp
[HttpPost]
public async Task<IActionResult> CreateReport([FromForm] CreateReportDto dto)
{
    if (dto.Photo != null)
    {
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(dto.Photo.FileName)}";
        var filePath = Path.Combine("wwwroot/uploads", fileName);
        
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await dto.Photo.CopyToAsync(stream);
        }
        
        dto.PhotoUrl = $"/uploads/{fileName}";
    }
    
    // Save to database...
}
```

## Duplicate Detection Logic

Implement geospatial distance check in backend:

```csharp
public async Task<List<ObstacleReport>> FindDuplicates(GeoJSONGeometry geometry)
{
    // For Point geometry: Find all points within 100 meters
    if (geometry.Type == "Point")
    {
        var point = new Point(geometry.Coordinates[0], geometry.Coordinates[1]);
        var duplicates = await _context.ObstacleReports
            .Where(r => r.Status != "Merged")
            .Where(r => ST_Distance_Sphere(r.Geometry, point) < 100)
            .ToListAsync();
        
        return duplicates;
    }
    
    // For LineString: Similar logic with ST_Distance
    // ...
}
```

## Integration Steps

1. **Update API Base URL**
   - Edit `/lib/api.ts` and set `API_BASE_URL`
   - Or use environment variable `REACT_APP_API_URL`

2. **Replace Mock Data**
   - Remove `/lib/mockData.ts` usage
   - Update components to use `/lib/api.ts` instead

3. **Authentication**
   - Replace mock auth in `LoginScreen.tsx` with `authApi.login()`
   - Store JWT token in localStorage or cookies
   - Add token to API requests

4. **GPS Integration**
   - Consider using `leaflet-locate` plugin (already added CSS)
   - Current implementation uses browser Geolocation API

5. **Error Handling**
   - Add proper error boundaries
   - Display user-friendly error messages
   - Log errors to backend for monitoring

## Testing

Test API endpoints with tools like:
- **Postman** - API testing
- **Swagger** - ASP.NET Core built-in API docs
- **Browser DevTools** - Network tab for debugging

## Security Considerations

1. **Authentication**
   - Use JWT tokens or ASP.NET Core Identity
   - Implement refresh tokens
   - Secure password hashing (bcrypt/PBKDF2)

2. **Authorization**
   - Role-based access control (Pilot vs Admin)
   - Validate user permissions on backend

3. **Input Validation**
   - Validate GeoJSON coordinates (WGS84 bounds)
   - Sanitize user inputs
   - File upload validation (size, type)

4. **HTTPS**
   - Always use HTTPS in production
   - Configure SSL certificates in Docker

## Docker Deployment

Example `docker-compose.yml`:

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=https://backend:5001/api
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - ConnectionStrings__DefaultConnection=Server=db;Database=navisafe;User=root;Password=yourpassword
    depends_on:
      - db

  db:
    image: mariadb:latest
    environment:
      - MYSQL_ROOT_PASSWORD=yourpassword
      - MYSQL_DATABASE=navisafe
    volumes:
      - mariadb-data:/var/lib/mysql

volumes:
  mariadb-data:
```

## Next Steps

1. ✅ Frontend is ready (current implementation)
2. ⚠️ Implement ASP.NET Core API endpoints (backend team)
3. ⚠️ Set up MariaDB database schema
4. ⚠️ Configure CORS and authentication
5. ⚠️ Test integration
6. ⚠️ Deploy to Docker

## Support

For questions about frontend-backend integration:
- Check TypeScript types in `/lib/types.ts`
- Review API service in `/lib/api.ts`
- See mock data in `/lib/mockData.ts` for expected data structure
