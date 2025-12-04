# README Documentation - NaviSafe

[![Navi-Safe-logo.png](https://i.postimg.cc/rFBbxXqr/Navi-Safe-logo.png)](https://postimg.cc/YhxbBPGr)

**NaviSafe** is a web-based solution app developed for **Kartverket** to assist pilots and administrators with safe navigation, flight and coordination.  
It connects tablet users in the field with a central orchestration layer, API services, and a containerized database backend.

---

## Table of Contents
- [About](#-about)
- [Contributors](#-contributors)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Components](#-components)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [Testing](#-testing)
- [Installation](#-installation)
- [Security](#-security-)
- [Use of external resources](#-use-of-external-resources)

---

## About
NaviSafe was developed as part of a collaboration with **Kartverket** to support:
- Pilots using tablets in the field
- Admin users managing navigation data
- Secure API requests and data orchestration
- Metrics collection and health monitoring

---

## Contributors
The founding members of NaviSafe from Group 9 consists of:
- *Ask Lootz*
- *Jimmy Trinh*
- *Per Rai Braatø*
- *Synne Kyrkjebø*
- *André Abrahamsen*
- *Rikke Krauss*

---

## Architecture
[![Navi-Safe-sysdiagram.png](https://i.postimg.cc/Cxw2mCfT/Navi-Safe-sysdiagram.png)](https://postimg.cc/BXwNvKgM)

### Frontend Architecture
The frontend is a modern web application built with **TypeScript** and **Leaflet**, utilizing a modular build process.

**Core Technologies & Packages:**

- **Language:** TypeScript 5.8.2 (transpiled to JavaScript).
    - **Map Engine:** `leaflet` (v1.9.4) for interactive mapping capabilities.
    - **Styling:** Uses SCSS/SASS (`sass` v1.86.1) for modular and maintainable styles.
- **Build Tooling:**
    - `rollup` (v4.38.0) for bundling modules.
    - `grunt` (v1.6.1) task runner for automating workflows (sass compilation, minification, copying assets).
    - `grunt-contrib-uglify`, `grunt-rollup`, `grunt-sass`.
- **Code Quality:**
    - `eslint` (v9.23.0) & `prettier` (v3.5.3) for linting and code formatting.
    - `stylelint` for SCSS validation.

### Backend Architecture
The backend is a containerized **ASP.NET Core 9.0** application designed for reliability and observability.

**Core Configuration:**

- **Application Name:** `NaviSafe`
- **Hosting:** Runs in a Docker container using the `mariadb` image.
- **Data Access:** Uses **Entity Framework Core** with `Pomelo.EntityFrameworkCore.MySql` to interact with the MariaDB database.
- **Authentication & Security:**
    - **JWT Bearer Auth:** Configured to support secure API token validation (`JwtTokenService`).
    - **Session Management:** Enables stateful interactions for MVC views with secure, HTTP-only cookies.
- **Observability:** Integrated **OpenTelemetry** pipeline providing:
    - Metrics (ASP.NET Core & HTTP Client instrumentation).
    - Distributed Tracing.
    - Logging via Console exporter.
- **Service Orchestration:** Implements service defaults (`AddServiceDefaults`, `MapDefaultEndpoints`) for standardized health checks and discovery in a cloud-native environment.

## Database Strategy
The solution employs a robust data persistence strategy centered around **MariaDB**:

- **ORM & Data Access:** Uses **Entity Framework Core** with the `Pomelo.EntityFrameworkCore.MySql` provider. This allows for strongly-typed queries, efficient change tracking, and LINQ support.
- **Connection Management:**
    - **Auto-Detection:** Implements `ServerVersion.AutoDetect` to dynamically configure features based on the specific MariaDB version running in the container.
    - **Service Integration:** Explicitly registers a named `MySqlDataSource` ("mariaDatabase"). This pattern supports .NET service defaults, enabling automatic health checks and standardized metrics collection.
- **Resilience:** The startup configuration includes fallback logic (prioritizing `mariaDatabase` over `DefaultConnection`) to ensure the application connects reliably whether running locally or within the Docker Compose orchestration.

### Importing Database

In order to set up the accounts you need to import the mariaDatabase SQL Source file:
1. Clone the repository
2. Open File explorer and navigate C:\NaviSafe\NaviSafe and find the **mariaDatabase** SQL Source file
3. Copy the file
4. Open Phpmyadmin and click Import
5. Import the file

--- 

#### Database Schema
The database schema is designed to support a single user account with a single table for storing navigation data.

##### 1. Database Creation
The database is created automatically during the first run of the application. All the following SQL statements are executed within phpMyAdmin:

```sql
-- mariaDatabase Creation
CREATE DATABASE IF NOT EXISTS `mariaDatabase` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
USE `mariaDatabase`;
```

##### 2. Table Creation
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
    `img` mediumblob DEFAULT NULL,
    `isSent` tinyint(1) NOT NULL,
    `state` enum('SENT','PENDING','REJECTED') NOT NULL,
    `rejectComment` varchar(255) DEFAULT NULL,
    `userID` int(11) NOT NULL,
    `creationDate` timestamp NOT NULL DEFAULT current_timestamp(),
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

##### 3. Data Insertion
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

### Workflow
1. **Tablet & Admin Clients** send `POST`/`GET` requests.
2. **Front-End** communicates with the **Aspire.NET orchestration layer**.
3. **Orchestration** handles:
   - API services
   - Metrics
   - Data processing
4. **Dockerized Back-End** runs:
   - ASP.NET 9.0 Web Server
   - MariaDB 11.8 Database
   - phpMyAdmin for DB management

---

## Features
- RESTful API for front-end requests
- Metrics and monitoring support
- MariaDB database for data persistence
- Dockerized infrastructure for easy deployment
- Secure connection & administration channel

---

## Tech Stack
| Layer | Technology                                        |
|------|---------------------------------------------------|
| **Front-End** | *(Leaflet, JavaScript, CSS, Bootstrap CSS, HTML)* |
| **API & Orchestration** | ASP.NET Core 9.0                                  |
| **Database** | MariaDB 11.8                                      |
| **DB Admin Tool** | phpMyAdmin 5.2                                    |
| **Containerization** | Docker, Docker File                               |

---

## Components

### 1. Controllers (`NaviSafe/Controllers/`)
Handle incoming HTTP requests, manage application flow, and interact with services.
- **`AccountController.cs`**: Manages user authentication flows including Login, Logout, and session handling.
- **`RegistrationController.cs`**: Handles new user sign-ups and validation logic.
- **`ObstacleController.cs`**: Manages the core domain logic for reporting and retrieving navigation obstacles.
- **`AuthController.cs`**: Likely handles lower-level authentication mechanisms or API-specific auth tokens.
- **`HomeController.cs`**: Serves the main landing page and dashboard entry points.

### 2. Models (`NaviSafe/Models/`)
Define the data structure and business entities used across the application.
- **Domain Entities**:
  - `ObstacleData.cs`: Represents navigation hazards reported by pilots.
  - `UserEntities.cs`: Core user profile data structure.
  - `RegistrationEntities.cs`: Data structures specific to the registration process.
- **View Models & DTOs**:
  - `LoginViewModel.cs` / `LoginUserModel.cs`: Data transfer objects for authentication forms.
  - `RegisterViewModel.cs`: Captures and validates user input during registration.
  - `ErrorViewModel.cs`: Standardized structure for displaying errors to the UI.

### 3. Views (`NaviSafe/Views/`)
Razor views responsible for the server-side rendering of the HTML UI.
- **`Home/`**: Main dashboard and landing page templates.
    - **`Account/`**: Login and profile management interfaces.
    - **`Obstacle/`**: Forms for reporting obstacles and lists for viewing them.
    - **`Shared/`**: Reusable layout components (headers, footers, navigation bars).

### 4. Services (`NaviSafe/Services/`)
Encapsulate business logic and data access to keep controllers lightweight.
- **`UserStorage.cs`**: A singleton or scoped service that acts as an abstraction layer for user data persistence (interacting with the database or in-memory store).
- **`JwtTokenService.cs`**: Handles the generation and validation of JSON Web Tokens for secure API authentication.

---

**Key Responsibilities:**
- Login/Logout operations
- User registration
- Session management
- Input validation
- Security token verification

---

## Getting Started

### Prerequisites
Make sure you have:
- [.NET SDK 9.0+](https://dotnet.microsoft.com/)
- [Docker](https://www.docker.com/)
- [Git](https://git-scm.com/)

---

## Usage

### 1. Login
Visit http://localhost:8080 to access the login page. 

#### Admin 
Use the following credentials to log in as an admin user:
- **Email**: *admin@kartverket.no*
- **Password**: *admin123*

#### Pilot users
Use the following credentials to log in as a pilot user:
- **Email**:
    - pilot@nla.no
    - pilot@politiet.no
    - pilot@forsvaret.no
- **Password**: *test123*

From here, after you have logged in, you will arrive to the main dashboard.

### 2. Home Dashboard
After a successful login, you should now have access the main dashboard. From here, you can navigate to **Register Obstacle**. 

### 3. Obstacle Registration
1. Fill in **Obstacle Name** and **Obstacle Height**.
2. Add a **Description** with details about the obstacle.
3. Select the location of the map (powered by OpenStreetMap + Leaflet). You will receive a pop-up notification whether you will allow to turn on location or not.
After that, you should be able to draw a marker on the map. Then **Coordinates Preview** will pinpoint your coordinates in terms of longitude and latitude, while 
**Live coordinates** tracks your location with described coordinates in realtime. 
4. Click **Submit Data** - the data will be sent via `POST`to the API and stored in the MariaDB database. 
5. After submitting data, you can select **Back To Home** and thus return to the main dashboard.

### 4. Return to Home Dashboard and Logout
You can also click on the **NaviSafe** name in order to return to your main dashboard. If you wish to logout, simply click on the **Logout** button.

---

## Testing
The objective of this **Test Scenario** is to verify that pilots can submit data, interact with the map, and have their location accurately tracked. And that admins can manage and review reports

Preconditions:
This test scenario assumes the following:
•   The pilot/admin is logged in to their account
•   The pilot/admin has service
•   The pilot is using an iOS Device with Safari or Google Chrome

### TS-01: Pilot obstacle report with pin
- **Input**: Submit an obstacle with type, height, a description and a pin.
- **Expected result**: The obstacle is submitted for review and a new report form is shown
- **Actual result**: The obstacle is sent to the admin for review

---

### TS-02: Pilot obstacle report without pin
- **Input**: Submit an Obstacle with Type, Height and Description but without pin
- **Expected result**: the helicopter’s live location will be used instead of the pin
- **Actual result**: The helicopters live location is used and a report is successfully sent for review

---

### TS-03: Pilot obstacle report with pin - without fields
- **Input**: Submitting just a pin without any fields
- **Expected result**: You must add an obstacle type before saving as draft or submitting the report
- **Actual result**: Pressing submit takes you to the Obstacle Type section, where you must select a type

---

### TS-04: Pilot adding a picture to the obstacle report
- **input**: Upload or take a picture with the camera
- **Expected result**: The picture is added to the report
- **Actual result**: The picture is sucessfully added to the report 

---

### TS-05: Pilot saving obstacle as draft 
- **input**: Select and obstacle type and then save it as a draft
- **Expected result**: The draft is saved in the my registrations tab
- **Actual result**: The draft is saved and can be edited at a later point

---

### TS-06: Verifying the location trackers' accuracy
Verify the location trackers' accuracy. Three devices were tested after the group noticed a difference in the accuracy of our devices and browsers. 

**Expected results**: Tracker inaccuracy does not exceed 50 meters

**Actual results**: 
- iPhone 14 Plus’s accuracy constantly changed between 5-31 Meters
- Windows 11 Laptop was tested with Opera GX, giving either 4911 or 22.5 meters and Google Chrome with 128 Meters of inaccuracy
- MacBook M1 Pro had an accuracy of 35 Meters

The iPhone 14 Plus and MacBook's results are satisfactory, while the laptop's range was too unstable.
Note that the group did not have any working iPads available, so an iPhone was used as a substitute

---

### TS-07: Verify the Administrators ability to approve obstacles

**Input**: View a pending report and change status to Approved/Published. Write a reason for the decision and press Update status.
**Expected results**: The obstacle is successfully approved, and becomes green to signify this.
**Actual result**: The obstacle's status is changed to approved

---

### TS-07: Verify the Administrators ability to reject obstacles

**input**: View a pending report and change its status to Rejected. Write a reason for the rejection and press Update status
**Expected result**: The report is rejected
**Actual result**: The report has been succesfully rejected 

---

### TS-08: Verify the Administrator ability to sort reports by the approved status

**input**: Click the approved button on the admin dashboard 
**Expected result**: Only approved reports will show
**Actual result**: Approved reports are the only ones displayed

---

### TS-09:  Verify the Administrator ability to sort reports by the pending status

**input**: Click the pending review button on the admin dashboard 
**Expected result**: Only pending reports will show
**Actual result**: pending reports are the only ones displayed

---

### TS-09:  Verify the Administrator ability to sort reports by the rejected status

**input**: Click the rejected button on the admin dashboard 
**Expected result**: Only rejected reports will show
**Actual result**: rejected reports are the only ones displayed

---

### TS-09:  Verify the Administrator ability to sort reports to total submitted reports

**input**: Click the total submitted reports button on the admin dashboard 
**Expected result**: All reports will show
**Actual result**: Every report is shown 

---

### TS-10: Verify the administrators ability to view the obstacle report's image

**input** click the View button under the image tab
**Expected result: The image is shown to the administrator
**actual result**: The image is opened in a new tab, providig a clear view

---

### TS-11: Verify the administrators ability to view reports on the map

**input**: Click on show map view
**Expected result**: A map with all obstacles is shown
**Actual result**: A map is shown with all obstacles color coded by status

---

### TS-12: Verify the administrators ability to view obstacle details on the map

**input** Click on an obstacle and then details
**Expected result** Admin is taken to the report details & review page
**Actual result** The admin is taken to the page for changing report status







### TC-01: Successful Login
**Steps:**
1. Navigate to `/Account/Login`
2. Enter email: `admin@kartverket.no `
3. Enter password: `admin123`
4. Click "Login"

**Expected Result:** Redirect to Home dashboard with authenticated session

**Actual Result:** Pass

---

### TC-02: Invalid Data
**Steps:**
1. Navigate to `/Account/Login`
2. Enter email: `admin@kartverket`
3. Enter password: `WrongPassword`
4. Click "Login"

**Expected Result:** Error message "Invalid email or password" displayed

**Actual Result:** Pass

---

### TC-03: Empty Form Submission
**Steps:**
1. Navigate to `/Account/Login`
2. Leave email and password fields empty
3. Click "Login"

**Expected Result:** Validation errors for required fields

**Actual Result:** Pass

---

### TC-04: Invalid Email Format
**Steps:**
1. Navigate to `/Account/Login`
2. Enter email: `notanemail`
3. Enter password: `admin123`
4. Click "Login"

**Expected Result:** Email format validation error

**Actual Result:** Pass

---

### TC-05: Session Consistency
**Steps:**
1. Login successfully
2. Navigate to different pages
3. Check session data remains intact

**Expected Result:** User remains authenticated across page navigation

**Actual Result:** Pass

---

#### TC-06: Logout Functionality
**Steps:**
1. Login successfully
2. Click "Logout" button
3. Try accessing protected pages

**Expected Result:** Session cleared, redirected to login page

**Actual Result:** Pass

---

## Installation
Clone and set up the project:

```bash
git clone https://github.com/asklootz/NaviSafe.git
cd NaviSafe
dotnet restore
```
If you want to run it with https, you need to set up a self-signed certificate.
```bash
dotnet dev-certs https --trust
```

---

## Security :lock:
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

## Use of external resources
Thanks to all the different open-source resources that have been used in order to develop NaviSafe, including but not limited to:
- [Docker Engine](https://www.docker.com/):[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [MariaDB Foundation](https://mariadb.org/):[GPL v2 License](https://mariadb.org/about-us/licensing/)
- [phpMyAdmin](https://www.phpmyadmin.net/):[GPL v2 License](https://www.phpmyadmin.net/about/legal/)
- Live GPS location services [Leaflet Locate Control v0.85.0](https://github.com/domoritz/leaflet-locatecontrol):[MIT License](https://github.com/domoritz/leaflet-locatecontrol/blob/gh-pages/LICENSE)
- Interactive map [Leaflet v1.9.4](https://leafletjs.com/):[BSD 2-Clause "Simplified" License](https://github.com/Leaflet/Leaflet/blob/main/LICENSE)
- Map service provider [OpenStreetMap](https://www.openstreetmap.org/):[Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/1.0/)
