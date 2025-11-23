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
| Layer | Technology                                        |
|------|---------------------------------------------------|
| **Front-End** | *(Leaflet, JavaScript, CSS, Bootstrap CSS, HTML)* |
| **API & Orchestration** | ASP.NET Core 9.0                                  |
| **Database** | MariaDB 11.8                                      |
| **DB Admin Tool** | phpMyAdmin 5.2                                    |
| **Containerization** | Docker, Docker File                               |

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

### 1. Login Screen (For Admins)
Visit http://localhost:8080 to access the login page.
•	Email: admin@kartverket.no  
•	Password: admin123
From here, after you have logged in, you will arrive to the admin dashboard.

### 2. Admin Dashboard

After a successful login, you should now have access the main admin dashboard. Here you can view a map with all the reports from across the country and their statuses. Scrolling down will reveal a list of each obstacle and their respective information.
By clicking the “View Details” Button under the “Action” tab will allow you to assign the Report to another handler, comment on the report and either approve or reject the report. When you are finished you can logout with the logout button in the top right part of the screen.

---

### 1. Login Screen (For Pilots)
Visit http://localhost:8080 to access the login page.
•	Email: pilot@nla.no | pilot@politiet.no | pilot@forsvaret.no | admin@kartverket.no 
•	Password: test123
From here, after you have logged in, you will arrive to the main dashboard.

### 2. Home Dashboard

After a successful login, you are directed to the Report obstacle page

### 3. Obstacle Registration

1.	Fill in Obstacle Name and Obstacle Height.
2.	Add an optional Description with details about the obstacle.
3.	Select the obstacles’ location on the map as a point or multiple lines(powered by OpenStreetMap + Leaflet) or use your GPS Location. You will receive a pop-up notification whether you will allow to turn on location or not. The latitude and longitude are shown below the map
4.	Click Submit Data - the data will be sent via POSTto the API and stored in the MariaDB database.
5.	After submitting data, you can click the “My Reports” Button to then view submitted obstacles and report new ones. You can also click the “Logout” Button to log out of your account

---

## Testing

The objective of this **Test Scenario** is to verify that users can submit data, interact with the map, and have their location accurately tracked.
### Pilot test scenario

Preconditions:

This test scenario assumes the following: 
• The pilot is logged in to their account 
• The pilot has service 
• The pilot is using an iOS Device with Safari or Google Chrome

### TS-01: Obstacle Registration with pin
•	Input: Submit an obstacle with type, height, a description and a pin.
•	Expected result: The obstacle is submitted and you are sent to a new report form
•	Actual result: The obstacle is submitted successfully however you are sent to a white screen. You can from here select “My Reports” or log out via the logout button
________________________________________
### TS-02: Obstacle Registration with GPS Location
•	Input: Submit an Obstacle with Type, Height and Description and use the Helicopters GPS Location
•	Expected result: the helicopter’s live location will be used instead of the pin
•	Actual result: The GPS Location is successfully applied and the obstacle is submitted successfully, however you are sent to a white screen. You can from here select “My Reports” or log out via the logout button
________________________________________
### TS-03: Obstacle Registration with pin - without fields
•	Input: Submitting just a pin without any fields
•	Expected result: a pin is dropped and the registration can be saved as a draft
•	Actual result: You are asked to either fill out the forms or save the report as a draft
________________________________________
### TS-04: Obstacle Registration - Drag and Drop a pin
Drag and drop a pin on the map
•	Expected result: A pin is dropped on the map
•	Actual result: A pin is dropped on the map and the live tracker disappears
________________________________________
### TS-05: Verifying the location trackers' accuracy
Verify the location trackers' accuracy. Three devices were tested after the group noticed a difference in the accuracy of our devices and browsers.
Expected results:
•	Tracker inaccuracy does not exceed 50 meters
Actual results:
•	iPhone 14 Plus’s accuracy constantly changed between 5-31 Meters
•	Windows 11 Laptop was tested with Opera GX, giving either 4911 or 22.5 meters and Google Chrome with 128 Meters of inaccuracy
•	MacBook M1 Pro had an accuracy of 35 Meters
The iPhone 14 Plus and MacBook's results are satisfactory, while the laptop's range was too unstable. Note that the group did not have any working iPads available, so an iPhone was used as a substitute
________________________________________

### Admin test scenario

Preconditions:

This test scenario assumes the following: 
• The admin is logged in to their account  

### TS-01: Approve a report
•	Input: click **View Details** and click Approve
•	Expected result: The obstacle's status is set to approved
•	Actual result: The obstacle's status is set to approved

### TS-02: Reject a report
•	Input: click **View Details** and click Approve
•	Expected result: The obstacle's status is set to rejected
•	Actual result: The obstacle's status is set to rejected

### TS-03: Sort the obstacle reports by status
•	Input: click the **All statuses** button and click either **Pending Review**, **Approved** or **Rejected**
•	Expected result: The list of reports only show the selected status
•	Actual result: The list of reports only show the selected status

### TS-04: Sort the obstacle reports by Organizations
•	Input: click the **All Organizations** button and click either **Norwergian Air Ambulance**, **Air Force** or **Police**
•	Expected result: The list of reports are only from the selected organization
•	Actual result: Only the reports from that organization is shown

### TS-05: Sort the obstacle reports by Obstacle type
•	Input: click the **All types** button and click either **Tower/Mast**, **Power Line** or **Other**
•	Expected result: The list of reports are only of that obstacle type
•	Actual result: Only the reports with that obstacle type are shown

---

### TS-01: Successful Login
**Steps:**
1. Navigate to `/Account/Login`
2. Enter email: `admin@kartverket.no`
3. Enter password: `Admin123`
4. Click "Login"

**Expected Result:** Redirect to Home dashboard with authenticated session

**Actual Result:** Pass

---

### TS-02: Invalid Data
**Steps:**
1. Navigate to `/Account/Login`
2. Enter email: `admin@kartverket.no`
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

---
## Use of external resources
Thanks to all the different open-source resources that have been used in order to develop NaviSafe, including but not limited to:
- [Docker Engine](https://www.docker.com/):[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [MariaDB Foundation](https://mariadb.org/):[GPL v2 License](https://mariadb.org/about-us/licensing/)
- [phpMyAdmin](https://www.phpmyadmin.net/):[GPL v2 License](https://www.phpmyadmin.net/about/legal/)
- Live GPS location services [Leaflet Locate Control v0.85.0](https://github.com/domoritz/leaflet-locatecontrol):[MIT License](https://github.com/domoritz/leaflet-locatecontrol/blob/gh-pages/LICENSE)
- Interactive map [Leaflet v1.9.4](https://leafletjs.com/):[BSD 2-Clause "Simplified" License](https://github.com/Leaflet/Leaflet/blob/main/LICENSE)
- Map service provider [OpenStreetMap](https://www.openstreetmap.org/):[Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/1.0/)
- SVG icons from [Iconify Design](https://iconify.design/):[MIT License](https://github.com/iconify/iconify/blob/main/license.txt)
