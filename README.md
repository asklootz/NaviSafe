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

**Workflow:**
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
| Layer | Technology |
|------|-------------|
| **Front-End** | *(Leaflet, JavaScript, CSS, Tailwind CSS, HTML)* |
| **API & Orchestration** | ASP.NET Core 9.0 |
| **Database** | MariaDB 11.8 |
| **DB Admin Tool** | phpMyAdmin 5.2 |
| **Containerization** | Docker, Docker Compose |

---

## Components

### 1. Models

#### `LoginViewModel.cs`
Data transfer object for login form submission:
- `Email` - User email (required, validated)
- `Password` - User password (required, data type: password)
- `RememberMe` - Persistent login flag (boolean)

```csharp
public class LoginViewModel
{
    [Required]
    [EmailAddress]
    [Display(Name = "Email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [DataType(DataType.Password)]
    [Display(Name = "Password")]
    public string Password { get; set; } = string.Empty;

    [Display(Name = "Remember me?")]
    public bool RememberMe { get; set; }
}
```

#### `LoginUserModel.cs`
Database entity extending ASP.NET Core Identity:
- Inherits from `IdentityUser`
- `LastLogin` - Timestamp of last successful login (nullable)

```csharp
public class LoginUserModel : IdentityUser
{
    public DateTime? LastLogin { get; set; }
}
```

### 2. Controller

#### `AccountController.cs`
Handles all authentication-related HTTP requests, using `GET` and `POST` methods:

```csharp
[HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Login(LoginViewModel model, string? returnUrl = null)
    {
        if (!ModelState.IsValid)
            return View(model);

        if (!_userStorage.ValidateUser(model.Email, model.Password))
        {
            ModelState.AddModelError(string.Empty, "Invalid email or password.");
            return View(model);
        }

        // Login successful - store user in session
        StoreUserInSession(model.Email);
        
        return RedirectToReturnUrl(returnUrl);
    }
```

**Key Responsibilities:**
- Login/Logout operations
- User registration
- Session management
- Input validation
- Security token verification

**Dependencies:**
- `UserStorage` - Injected service for user data operations

### 3. **Service Layer**

#### `UserStorage.cs`
Singleton service managing user data:

**UserData Structure:**
```csharp
public class UserStorage
{
    public class UserData
    {
        public string UserId { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string StreetAddress { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public DateTime RegisteredDate { get; set; }
        
        public string FullAddress => $"{StreetAddress}, {PostalCode} {City}, {Country}";
    }
```

**Core Methods:**
- `ValidateUser(email, password)` - Credential verification
- `UserExists(email)` - Check email registration status
- `RegisterUser(...)` - Create new user account
- `GetUserInfo(email)` - Retrieve user profile data

---

## Getting Started

### Prerequisites
Make sure you have:
- [.NET SDK 9.0+](https://dotnet.microsoft.com/)
- [Docker](https://www.docker.com/)
- [Git](https://git-scm.com/)

---

## Usage

### 1. Login Screen
Visit http://localhost:8080 to access the login page. 
- **Email**: *admin@navisafe.com*
- **Password**: *Admin123*

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
The objective of this **Test Scenario** is to verify that users can submit data, interact with the map, and have their location accurately tracked.

Preconditions:
This test scenario assumes the following:
•   The pilot is logged in to their account
•   The pilot has service
•   The pilot is using an iOS Device with Safari or Google Chrome

### TS-01: Obstacle Registration with pin
- **Input**: Submit an obstacle with type, height, a description and a pin.
- **Expected result**: The obstacle is submitted and appears on the map
- **Actual result**: The obstacle is displayed on the map

---

### TS-02: Obstacle Registration without pin
- **Input**: Submit an Obstacle with Type, Height and Description but without pin
- **Expected result**: the helicopter’s live location will be used instead of the pin
- **Actual result**: Feature not available, the registration goes through; however, no marker on the map

---

### TS-03: Obstacle Registration with pin - without fields
- **Input**: Submitting just a pin without any fields
- **Expected result**: a pin is dropped and the registration can be completed later
- **Actual result**: Feature not available, you will be asked to fill the fields

---

### TS-04: Obstacle Registration - Drag and Drop a pin
Drag and drop a pin on the map
- **Expected result**: A pin is dropped on the map
- **Actual result**: A pin is dropped on the map and the live tracker disappears

---

### TS-05: Verifying the location trackers' accuracy
Verify the location trackers' accuracy. Three devices were tested after the group noticed a difference in the accuracy of our devices and browsers. 

**Expected results**: 
- Tracker inaccuracy does not exceed 50 meters

**Actual results**: 
- iPhone 14 Plus’s accuracy constantly changed between 5-31 Meters
- Windows 11 Laptop was tested with Opera GX, giving either 4911 or 22.5 meters and Google Chrome with 128 Meters of inaccuracy
- MacBook M1 Pro had an accuracy of 35 Meters

The iPhone 14 Plus and MacBook's results are satisfactory, while the laptop's range was too unstable.
Note that the group did not have any working iPads available, so an iPhone was used as a substitute

---

### TS-01: Successful Login
**Steps:**
1. Navigate to `/Account/Login`
2. Enter email: `admin@navisafe.com`
3. Enter password: `Admin123`
4. Click "Login"

**Expected Result:** Redirect to Home dashboard with authenticated session

**Actual Result:** Pass

---

### TS-02: Invalid Data
**Steps:**
1. Navigate to `/Account/Login`
2. Enter email: `admin@navisafe.com`
3. Enter password: `WrongPassword`
4. Click "Login"

**Expected Result:** Error message "Invalid email or password" displayed

**Actual Result:** Pass

---

### TS-03: Empty Form Submission
**Steps:**
1. Navigate to `/Account/Login`
2. Leave email and password fields empty
3. Click "Login"

**Expected Result:** Validation errors for required fields

**Actual Result:** Pass

---

### TS-04: Invalid Email Format
**Steps:**
1. Navigate to `/Account/Login`
2. Enter email: `notanemail`
3. Enter password: `Admin123`
4. Click "Login"

**Expected Result:** Email format validation error

**Actual Result:** Pass

---

### TS-05: Session Consistency
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
