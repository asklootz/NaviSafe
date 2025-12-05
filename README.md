# NaviSafe - Aerial Obstacle Reporting System

[![Navi-Safe-logo.png](https://i.postimg.cc/rFBbxXqr/Navi-Safe-logo.png)](https://postimg.cc/YhxbBPGr)

**NaviSafe** is a web-based solution app developed for **Kartverket** to assist pilots and administrators with safe navigation, flight and coordination.  
The system is tailored to tablet users and connects pilots in the field to a centralized orchestration layer, an ASP.NET Core backend, and a containerized MariaDB database.

---

# Table of Contents

- [Contributors](#contributors)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Test Accounts](#test-accounts)
- [Usage](#usage)
- [Testing](#testing)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Components](#components)
- [Database Strategy](#database-strategy)
- [Security](#security)
- [Use of External Resources](#use-of-external-resources)

---
# Contributors
The founding members of NaviSafe from Group 9 consists of:
- *Ask Lootz*
- *Jimmy Trinh*
- *Per Rai Braatø*
- *Synne Kyrkjebø*
- *André Abrahamsen*
- *Rikke Krauss*
---

# Prerequisites
**Install:**
- [.NET 9.0+ SDK](https://dotnet.microsoft.com/en-us/download/dotnet/9.0)
- [Docker](https://www.docker.com/products/docker-desktop/)
- [Git](https://www.docker.com/products/docker-desktop/)
---

# Quick Start
### 1. Clone and run the project
```bash
git clone https://github.com/asklootz/NaviSafe.git
cd NaviSafe
dotnet restore
dotnet run
```
After you have cloned the repo, run the project via IDE program. You should be redirected to the Aspire Dashboard.

### 2. Access the application
Access the `Aspire dashboard` via url from the CLI\
Should appear as 
```http request
http://localhost:17163/login?t=<<idKey>>
```
Click on the `naviSafe` link in Aspire dashboard or navigate to:
```arduino
https://localhost:8081/
```

If HTTPS certificate warnings appear:
```bash
dotnet dev-certs https --trust
```
After installing self-signed certificate, you might still need to manually trust the self-signed certificate in your browser.

---

# Test Accounts
| Email | Password |
|-------|----------|
| admin@kartverket.no | admin123 |
| pilot@nla.no | test123 |
| pilot@forsvaret.no | test123 |
| pilot@politiet.no | test123 |

---

# Usage
This section explains the application from a new user's perspective. No technical knowledge required.
### 1. Login (Pilot)
Navigate to:
```https request
https://localhost:8081/Account/Login
```
Enter an admin or pilot account to access the dashboard.

### 2. Register an Obstacle
```https request
https://localhost:8081/Obstacle/DataForm
```
From the dashboard, you can:
- Register new obstacles
- Navigate through different entities and fill in such as:
    - *Obstacle Type*
    - *Obstacle Description*
    - *Provide Coordinates*
    - *Latitude*
    - *Longitude*
    - *Obstacle Height (in feet)*
    - *Camera function and ability to upload a picture*

**Selecting a location**
1. Allow GPS-location access
2. Drop a marker on the Leaflet map
3. Coordinates appear automatically (can also fill in manually)

- Save as a draft
- Submit data
- Clicking on **"My Registrations"** and redirects you to a complete overview of obstacle reporting page

### 3. View My Registrations
```https request
https://localhost:8081/Obstacle/Overview
```
You can view:
- Stored obstacles
- Status (Pending, Approved, Rejected)
- Metadata
- Coordinates
- Images
- View Details / View on Map

### 4. Logout
Use the Logout button in the navigation bar.

### 1. Login (Admin)
Navigate to:
```ardunino
https://localhost:8081/Account/Login
```
Enter an admin account to access the admin dashboard.

### 2. Admin Dashboard
```https request
https://localhost:8081/Home/AdminDashboard
```
From the dashboard, as an admin user, you have access to:
- Have a complete overview of submitted obstacle reports
- An unique ID, obstacle type, description, reporter name, status, date, image and action of viewing report details
- **Total Submitted Reports**, **Pending Review**, **Approved** and **Rejected** is clickable and can filter lists in respective segments
- Optional to create a new obstacle form

### 3. Map View
After clicking on the **Show Map View** button on the navigation bar, you can:
- Have access to the Leaflet map where markers are pinpointed with their unique color code (*green = submitted, yellow = pending, red = rejected*)
- Clicking on the particular marker will provide a field of reporting details
- By clicking on **View Details** will redirect you back to the dashboard and a reporting detail will be shown

### 4. New Report
Using the same instances as pilot, you can:
- Register new obstacles
- Navigate through different entities and fill in such as:
    - *Obstacle Type*
    - *Obstacle Description*
    - *Provide Coordinates*
    - *Latitude*
    - *Longitude*
    - *Obstacle Height (in feet)*
    - *Camera function and ability to upload a picture*

**Selecting a location**
1. Allow GPS-location access
2. Drop a marker on the Leaflet map
3. Coordinates appear automatically (can also fill in manually)

- Save as a draft
- Submit data

### 5. Report Details & Overview
You can view:
- Report information
- Location map
- Attached image
- Reporter information
- Admin review
- Update status by changing via the dropdown menu
- Quick approve or quick reject for minimal time consumption

### 6. Logout
Use the Logout button in the navigation bar.

---

# Testing
Testing details are provided in the [Tests.Doc.md](NaviSafe.Tests/Tests.Doc.md) file, located in:
`NaviSafe.Tests/Tests.Doc.md`.

---

# System Architecture
[![Navi-Safe-sysdiagram.png](https://i.postimg.cc/Cxw2mCfT/Navi-Safe-sysdiagram.png)](https://postimg.cc/BXwNvKgM)

NaviSafe is built on modern containerized infrastructure with clear seperation of frontend, backend, database, and orchestration layers.

**Workflow:**
1. Pilot/Admin clients communicates with ASP.NET Core
2. Backend persists data via EF Core to MariaDB
3. Aspire orchestrates app, along with phpMyAdmin and database containers
4. OpenTelemetry provides logs and metrics
5. Razor views serve all web pages

---

# Tech Stack
| Layer          | Technology / Tools                         | Description |
|----------------|--------------------------------------------|-------------|
| Frontend       | HTML                                       | UI structure and layout |
|                | CSS                                        | Styling and custom UI design |
|                | Bootstrap CSS                              | Responsive UI components |
|                | JavaScript                                 | Client-side logic and interactivity |
|                | Leaflet                                    | Interactive maps and geolocation |
| Backend        | ASP.NET Core 9.0                           | Main web application framework |
|                | MVC + Razor                                | Views, routing, UI rendering |
|                | EF Core (Pomelo provider)                  | ORM for MariaDB |
|                | OpenTelemetry                              | Logging, metrics, tracing |
|                | JWT                                        | Token-based authentication (API) |
| Database       | MariaDB 11.8                               | Relational database |
|                | phpMyAdmin                                 | Database management UI |
| Infrastructure | .NET Aspire                                | Orchestration & service hosting |
|                | Docker                                     | Containerized application environment |
| Mapping        | OpenStreetMap                              | Map tiles and geographic data |
|                | Leaflet Draw                               | Pin placement, geometry editing |

---

# Components
## **Controllers** `NaviSafe/Controllers/`

| Controller | Description |
|-------|----------|
| AccountController | Login, logout, authentication |
| HomeController | Dashboard & Navigation |
| ObstacleController | Obstacle Creation and Listing|

---

## Models `NaviSafe/Models/`
The domain includes:
- AdminReportViewModel
- ErrorViewModel
- LoginUserModel
- LoginViewModel
- ObstacleDataForm
- RegisterViewModel

These models map directly to mariaDatabase tables via EF Core.

## Views `NaviSafe/Views/`
Razor pages include:
- Login
- Register
- Dashboard (Pilot and Admin)
- Obstacle form
- Obstacle overview
- Shared UI Layout

## Services `NaviSafe/Services/`
Core services:
- UserStorage that manages the user database storage

---

# Database Strategy
The solution employs a robust data persistence strategy centered around **MariaDB**:

- **ORM & Data Access:** Uses **Entity Framework Core** with the `Pomelo.EntityFrameworkCore.MySql` provider. This allows for strongly-typed queries, efficient change tracking, and LINQ support.
- **Connection Management:**
    - **Auto-Detection:** Implements `ServerVersion.AutoDetect` to dynamically configure features based on the specific MariaDB version running in the container.
    - **Service Integration:** Explicitly registers a named `MySqlDataSource` ("mariaDatabase"). This pattern supports .NET service defaults, enabling automatic health checks and standardized metrics collection.
- **Resilience:** The startup configuration includes fallback logic (prioritizing `mariaDatabase` over `DefaultConnection`) to ensure the application connects reliably whether running locally or within the Docker Compose orchestration.

## Importing Database

In order to set up the accounts, you need to import the mariaDatabase SQL Source file:
1. Clone the repository
2. Open File explorer and navigate `C:\NaviSafe\NaviSafe` and find the **mariaDatabase** SQL Source file
3. Copy the file
4. Open phpMyAdmin and click Import
5. Import the file

--- 

### Database Schema
The database schema is designed to support a single user account with a single table for storing navigation data.

#### 1. Database Creation
The database is created automatically during the first run of the application. All the following SQL statements are executed within phpMyAdmin:

```sql
-- mariaDatabase Creation
CREATE DATABASE IF NOT EXISTS `mariaDatabase` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
USE `mariaDatabase`;
```

#### 2. Table Creation
The table contains the following columns:

1. **Organisation**
```sql
-- Organisation Table
CREATE TABLE IF NOT EXISTS `organisation` (
    `orgNr` int(11) NOT NULL AUTO_INCREMENT,
    `orgName` varchar(255) NOT NULL,
    PRIMARY KEY (`orgNr`)
    ) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

2. **Reporting**
```sql
-- Reporting Table
CREATE TABLE IF NOT EXISTS `reporting` (
  `regID` int(11) NOT NULL AUTO_INCREMENT,
  `lat` float NOT NULL,
  `lon` float NOT NULL,
  `altitude` float DEFAULT NULL,
  `accuracy` int(11) DEFAULT NULL,
  `shortDesc` varchar(50) DEFAULT NULL,
  `longDesc` varchar(255) DEFAULT NULL,
  `img` varchar(50) DEFAULT NULL,
  `isSent` bool NOT NULL,
  `state` enum('APPROVED','PENDING','REJECTED') NOT NULL,
  `rejectComment` varchar(255) DEFAULT NULL,
  `userID` int(11) NOT NULL,
  `creationDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `geoJSON` JSON DEFAULT NULL,
  PRIMARY KEY (`regID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

3. **UserAuth**
```sql
-- UserAuth Table
CREATE TABLE IF NOT EXISTS `userAuth` (
  `userID` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(70) NOT NULL,
  `passHash` varchar(255) DEFAULT NULL,
  `passSalt` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

4. **UserInfo**
```sql
-- UserInfo Table
CREATE TABLE IF NOT EXISTS `userInfo` (
  `userID` int(11) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `orgNr` int(11) NOT NULL,
  `roleID` char(5) NOT NULL,
  `creationDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`userID`),
  KEY `orgNr` (`orgNr`),
  KEY `roleID` (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

5. **UserRole**
```sql
-- User Role Table
CREATE TABLE IF NOT EXISTS `userRole` (
  `roleID` char(3) NOT NULL,
  `rolePermissions` enum('ADMIN','PILOT') NOT NULL,
  `permissionsDescription` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

#### 3. Data Insertion
The following data is inserted into the database upon application startup:

1. **Organisation**
```sql
-- Data Insertion for Organisation
INSERT INTO `organisation` (`orgNr`, `orgName`) VALUES
(1, 'Kartverket'),
(2, 'Norsk Luftambulanse'),
(3, 'Luftforsvaret'),
(4, 'Politiets Helikoptertjeneste');
```

2. **Reporting**
```sql
-- Data Insertion for Reporting
INSERT INTO `reporting` (`regID`, `lat`, `lon`, `altitude`, `accuracy`, `shortDesc`, `longDesc`, `img`, `isSent`, `state`, `rejectComment`, `userID`, `creationDate`) VALUES
(1, 63.4298, 10.394, 33, 22, 'Building in Trondheim', 'PHT_pilot1 registered building during low altitude patrol near Trondheim', NULL, 1, 'SENT', 'Submitted', 4, '2025-11-08 15:57:50'),
(2, 59.917, 10.7611, 25, 15, 'Power line over Oslo fjord', 'LUFT_pilot2 registered power line due to poor visibility in harsh weather', NULL, 1, 'SENT', 'Pending', 3, '2025-10-27 00:00:00'),
(3, 58.1585, 8.0165, 12, 8, 'High tower near Kjevik Airport', 'NLA_pilot1 registered tower observed during landing', NULL, 1, 'SENT', 'Submitted', 2, '2025-10-28 00:00:00');
```

3. **UserAuth**
```sql
-- Data Insertion for UserAuth
INSERT INTO `userAuth` (`userID`, `username`, `passHash`, `passSalt`) VALUES
(1, 'admin@kartverket.no', 'loodhHl1A1YABjm/4xD/hW2q/ZuCzWLop6g4361nD3Q=', 'PGgltVghys3nldsaJP5r3w=='),
(2, 'pilot@nla.no', 'lgFM6ogmbH1QhObvtrJhRKpJJzrzuzDS8Z+0iZxCYk4=', 'BRDgCz0DVguBDsC7wOAV8g=='),
(3, 'pilot@forsvaret.no', 'BzDuVukFeycwe2c1jxdebhOfl663fxEXEe5gHXHgD1I=', 'fzCGk9lA0PR+hEvb8uHjzA=='),
(4, 'pilot@politiet', '7kA1ghbxkuXDbzHjr0tVxB8wDfREsAOFH3S+IzPqJZE=', '4DBTxP+EUUmUhro+yJt2wA==');
```

4. **UserInfo**
```sql
-- Data Insertion for UserInfo
INSERT INTO `userInfo` (`userID`, `firstName`, `lastName`, `email`, `phone`, `orgNr`, `roleID`, `creationDate`) VALUES
(1, 'Yonathan', 'Admin', 'admin@kartverket.no', '40000000', 1, 'ADM', ' 2025-11-21 02:56:46'),
(2, 'Ola', 'Nordmann', 'pilot@nla.no', '41000001', 2, 'PIL', '2025-11-21 02:59:18'),
(3, 'Kari', 'Nordmann', 'pilot@forsvaret.no', '41000002', 3, 'PIL', ' 2025-11-21 03:06:35'),
(4, 'Die', 'Polizie', 'pilot@politiet.no', '42000003', 4, 'PIL', '2025-11-21 03:11:09');
```

5. **UserRole**
```sql
-- Data Insertion for UserRole
INSERT INTO `userRole` (`roleID`, `rolePermissions`, `permissionsDescription`) VALUES
('ADM', 'ADMIN', 'Full system access, including management and configuration'),
('PIL', 'PILOT', 'Limited access to flight and operational data');
```
---

# Security
Security measures have been taken to ensure the confidentiality and integrity of the data.\
We have set up a secure connection between the user and application using TLS encryption (selfsigned certificate).

### User authentication and authorization
We have set authentication and authorization policies to ensure that only authorized users can access the application.\
Users can only access the application if they are logged in, and certain features are restricted to specific user roles.\
Specifically, we have implemented role-based access control (RBAC) to restrict access to certain features based on user roles.\
User passwords are hashed hashing using ASP.NET Core Identity before being stored in the database. Using algorithmic hashing, with PBKDF2, Argon2, or bcrypt. \
All passwords are salted and hashed using a random salt. Making sure duplicate passwords will have different hashes.

### Aspire.NET access
Access to aspire is via a secure connection, using a randomized connection string and TLS encryption.

### MariaDB security
We have set up a secure connection between the the mariaDB database and the ASP.NET Core application, using a randomized password and connection string.\
EF Core automatically cleans input from user, making it so that it is never directly sent to the database as SQL queries, preventing SQL injection attacks.\
The database is therefore not accessible for any regular users username and password.\
Access to the database is usually either via the ASP.NET Core application or via phpMyAdmin.
```csharp
var mariaContainer = builder.AddMySql("mariaContainer", null, 3307)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithImage("mariadb:11.8")
    .WithContainerName("mariaContainer")
    .WithDataBindMount(source: "../MariaDB/Data") //Code to create a bind mount to a local folder
    .WithPhpMyAdmin(php =>   //Creates a phpMyAdmin container linked to the database container for easy management
        { php.WithHostPort(7447);}) //Sets a custom host port for phpMyAdmin, otherwise a random exposed port is assigned
    .WithOtlpExporter();
```
phpMyAdmin is also relying on connection string to connect to the database and have users login.

### Image upload security
We have implemented image upload security to prevent malicious users from uploading unwanted files.
Image files uploaded by users are stored in a separate folder, and are renamed, checked for file type, max size and had its file signature verified.

File extension and size validation:
```csharp
// Allowed image extensions and max size
private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
{ ".jpg", ".jpeg", ".png", ".gif", ".webp" };

private const long MaxImageBytes = 5 * 1024 * 1024; // 5 MB
```

File signature verification:
```csharp
// PNG: 89 50 4E 47
if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) return true;
// JPEG and JPG: FF D8
if (header[0] == 0xFF && header[1] == 0xD8) return true;
// GIF: 'G' 'I' 'F' '8'
if (header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x38) return true;
// WEBP: 'R' 'I' 'F' 'F' ... 'W' 'E' 'B' 'P'
if (header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
   && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50) return true;

return false;
```

File renaming:
```csharp
[HttpGet]
    public async Task<IActionResult> GetImage(int id)
    {
        try
        {
            var obstacle = await _db.Obstacles.FindAsync(id);
            if (obstacle == null || string.IsNullOrEmpty(obstacle.Img))
                return NotFound("Image not found");

            // obstacle.Img contains a relative path such as "/images/123_20251118T153000.jpg"
            return Redirect(obstacle.Img);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving image for obstacle {Id}", id);
            return StatusCode(500, "Error retrieving image");
        }
    }
```

### SQL Injection Protection
We have implemented SQL injection protection to prevent SQL injection attacks.
Using Entity Framework Core (EF Core) as our Object-Relational Mapper (ORM), we ensure that all database queries are parameterized, effectively mitigating the risk of SQL injection attacks.
EF Core automatically handles input sanitization, ensuring that user inputs are never directly concatenated into SQL queries.

### XSS Protection
We have implemented XSS protection to prevent cross-site scripting attacks.
ASP.NET Razor provides built-in protection against XSS attacks, using the built-in HTML encoding.
Image files uploaded by users are also protected against XSS attacks. Filenames are sanitized to remove any potentially harmful characters.
```razorhtmldialect
<!-- When displaying user content, Razor automatically HTML-encodes by default -->
<div class="obstacle-item">
    <h3>@Model.ShortDesc</h3> <!-- Automatically HTML-encoded ✅ -->
    <p>@Model.LongDesc</p> <!-- Automatically HTML-encoded ✅ -->
</div>
```

Controlling the data sources with Content Security Policy (CSP):
```csharp
// Content Security Policy - prevents XSS attacks
    // Define allowed sources for scripts, styles, fonts, images, and connections
    // Alternative sources that can be used: https://unpkg.com, https://cdn.jsdelivr.net
    context.Response.Headers.Append("Content-Security-Policy", 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' ''unsafe-eval' https://cdnjs.cloudflare.com https://*.tile.openstreetmap.org; " +
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;" +
        "font-src 'self' data: https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https://*.tile.openstreetmap.org https://www.w3.org https://cdnjs.cloudflare.com; " +
        "connect-src 'self' https://*.tile.openstreetmap.org");
    
    // Prevent clickjacking
    context.Response.Headers.Append("X-Frame-Options", "SAMEORIGIN");
    
    // Prevent MIME type sniffing
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    
    // XSS Protection (legacy browsers)
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    
    // Referrer Policy
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
```

Checking the sha-hash integrity of CDN resources or SRI (sub
```razorhtmldialect
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"
  integrity="sha512-ozq8xQKq6urvuU6jNgkfqAmT7jKN2XumbrX1JiB3TnF7tI48DPI4Gy1GXKD/V3EExgAs1V+pRO7vwtS1LHg0Gw=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer">
</script>
```

### CSRF Protection
We have implemented CSRF protection to prevent cross-site request forgery attacks.
ASP.NET Core provides built-in protection against CSRF attacks, using anti-forgery tokens for POST-requests.

Anti-forgery token implementation in page:
```razorhtmldialect
<form action="/Obstacle/Dataform" method="post" style="display: inline;">@Html.AntiForgeryToken()
   <button class="btn btn-outline-success btn-sm me-2"><i class="bi bi-geo-alt"></i> New rapport</button>
</form>
```

---

# Use of External Resources
Thanks to all the different open-source resources that have been used in order to develop NaviSafe, including but not limited to:
- [Docker Engine](https://www.docker.com/):[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [MariaDB Foundation](https://mariadb.org/):[GPL v2 License](https://mariadb.org/about-us/licensing/)
- [phpMyAdmin](https://www.phpmyadmin.net/):[GPL v2 License](https://www.phpmyadmin.net/about/legal/)
- Live GPS location services [Leaflet Locate Control v0.85.0](https://github.com/domoritz/leaflet-locatecontrol):[MIT License](https://github.com/domoritz/leaflet-locatecontrol/blob/gh-pages/LICENSE)
- Interactive map [Leaflet v1.9.4](https://leafletjs.com/):[BSD 2-Clause "Simplified" License](https://github.com/Leaflet/Leaflet/blob/main/LICENSE)
- Map service provider [OpenStreetMap](https://www.openstreetmap.org/):[Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/1.0/)
