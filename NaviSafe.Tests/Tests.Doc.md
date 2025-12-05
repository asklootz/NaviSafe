# Test Documentation

We use xUnit for unit testing, and all tests are collected in the project NaviSafe.Tests.
The main goal has been to test the parts of the system where we actually have logic and decisions, not just simple view rendering.

---

# Table of Contents
- [Functional Testing](#functional-testing)
- [Test Cases](#test-cases)
- [Login Test Cases](#login-test-cases)
- [User Tests](#user-tests)
- [Load Testing](#load-testing)
- [Unit Tests](#unit-tests)
- [How to Run the Tests](#how-to-run-the-tests)

## Functional Testing

The following user flows were validated:
- ✔️ Login success and failure
- ✔️ Obstacle registration with pin
- ✔️ Dynamic map interaction
- ✔️ Coordinate tracking
- ✔️ File upload validation
- ✔️ Session persistence
- ✔️ Logout navigation

**Preconditions:**

This test scenario assumes the following:

- The pilot/admin is logged in to their account
- The pilot/admin has service
- The pilot is using an iOS Device with Safari or Google Chrome

---

# Test Cases

### TS-01: Pilot obstacle report with pin

- **Input**: Click on the "Draw a marker" button on the left of the map and place a pin. Then input type, height and a description
- **Expected Result**: The obstacle is submitted for review and a new report form is shown
- **Actual Result**: The obstacle is sent to the admin for review

---

### TS-02: Pilot obstacle report without pin

- **Input**: Submit an Obstacle with Type, Height and Description but do not place a pin
- **Expected Result**: the helicopter’s live location will be used instead of the pin
- **Actual Result**: The helicopters live location is used and a report is successfully sent for review

---

### TS-03: Pilot saving obstacle as draft

- **Input**: Select an obstacle type and then save it as a draft
- **Expected Result**: The draft is saved in the my registrations tab
- **Actual Result**: The draft is saved and can be edited at a later point

---

### TS-04: Pilot obstacle report with pin - without fields

- **Input**: Click on the "Draw a marker" button on the left of the map and drop a pin, then submit without any fields
- **Expected Result**: Alert notifies you that you must add an obstacle type before saving as draft or submitting the report
- **Actual Result**: Pressing submit takes you to the Obstacle Type section, where you must select a type

---

### TS-05: Pilot adding a picture to the obstacle report

- **Input**: Upload or take a picture with the camera/uploade buttons
- **Expected Result**: The picture is added to the report
- **Actual Result**: The picture is sucessfully added to the report

---

### TS-06: Check the pilots own reports

- **Input**: Click the "my registrations" button
- **Expected Result**: My registration page is shown
- **Actual Result**: A list of the pilots registrations are shown

---

### TS-07: Edit a draft

- **Input**: Find the draft in "my registrations" and click edit draft
- **Expected Result**: You can edit the draft
- **Actual Result**: You are sent to the registration form to complete the draft

---

### TS-08: Verifying the location trackers' accuracy
Verify the location trackers' accuracy. Three devices were tested after the group noticed a difference in the accuracy of our devices and browsers.

**Expected Results**: 

- Tracker inaccuracy does not exceed 50 meters

**Actual Results**:
- iPhone 14 Plus’s accuracy constantly changed between 5-31 Meters
- Windows 11 Laptop was tested with Opera GX, giving either 4911 or 22.5 meters and Google Chrome with 128 Meters of inaccuracy
- MacBook M1 Pro had an accuracy of 35 Meters

The iPhone 14 Plus and MacBook's results are satisfactory, while the laptop's range was too unstable.
Note that the group did not have any working iPads available, so an iPhone was used as a substitute

---

### TS-09: Verify the Administrators ability to approve obstacles

- **Input**: Click "View Details" on a pending report and then "Pending Review". Change the status to Approved/Published, then write a reason for the decision and press Update status.
- **Expected Results**: The obstacle is successfully approved, and becomes green to signify this.
- **Actual Results**: The obstacle's status is changed to approved

---

### TS-10: Verify the Administrators ability to quick approve obstacles

- **Input**: Click "View details" on a pending report and then "quick approve"
- **Expected Results**: The report is approved
- **Actual Results**: the report has been approved

---

### TS-11: Verify the Administrators ability to reject obstacles

- **Input**: Click "View Details" on a pending report and then "Pending Review". Change the status to Rejected, then write a reason for the decision and press Update status.
- **Expected Result**: The report is rejected
- **Actual Result**: The report has been succesfully rejected

---

### TS-12: Verify the Administrators ability to quick reject

- **Input**: Click "View Details" on a pending report and click quick reject
- **Expected Result**: The report is rejected without needing to input a reason
- **Actual Result**: The report is rejected, and the reason is automatically put as "Quick Reject"

---

### TS-13: Verify the Administrator ability to sort reports by the approved status

- **Input**: Click the "Approved" button near the top of the admin dashboard
- **Expected Result**: Only approved reports will show
- **Actual Result**: Approved reports are the only ones displayed

---

### TS-14:  Verify the Administrator ability to sort reports by the pending status

- **Input**: Click the "Pending review" button near the top of the admin dashboard
- **Expected Result**: Only pending reports will show
- **Actual Result**: pending reports are the only ones displayed

---

### TS-15:  Verify the Administrator ability to sort reports by the rejected status

- **Input**: Click the "Rejected" button near the top of the admin dashboard
- **Expected Result**: Only rejected reports will show
- **Actual Result**: rejected reports are the only ones displayed

---

### TS-16:  Verify the Administrator ability to sort reports to total submitted reports

- **Input**: Click the "Total submitted reports" button near the top of the admin dashboard
- **Expected Result**: All reports will show
- **Actual Result**: Every report is shown

---

### TS-17: Verify the administrators ability to view the obstacle report's image

- **Input** Click the "View" button under the image tab
- **Expected Result**: The image is shown to the administrator
- **Actual Result**: The image is opened in a new tab, providig a clear view

---

### TS-18: Verify the administrators ability to view reports on the map

- **Input**: Click on the "show map view"
- **Expected Result**: A map with all obstacles is shown
- **Actual Result**: A map is shown with all obstacles color coded by status

---

### TS-19: Verify the administrators ability to view obstacle details on the map

- **Input** Click on an obstacle on the map and then details
- **Expected Result** Admin is taken to the report details & review page
- **Actual Result** The admin is taken to the page for changing report status

---

# Login Test Cases
These Test Cases are meant to check that the login page functions as intended

### TC-01: Creating an account
**Steps**
1. Navigate to 'Account/Login'
2. Click "Create an account"
3. Fill in the details
4. Click Register

**Expected Result**: A new account is created

**Actual Result**: Pass

---

### TC-02: Successful Login
**Steps:**
1. Navigate to `/Account/Login`
2. Enter email: `admin@kartverket.no `
3. Enter password: `admin123`
4. Click "Login"

**Expected Result:** Redirect to Home dashboard with authenticated session

**Actual Result:** Pass

---

### TC-03: Invalid Data
**Steps:**
1. Navigate to `/Account/Login`
2. Enter email: `admin@kartverket`
3. Enter password: `WrongPassword`
4. Click "Login"

**Expected Result:** Error message "Invalid email or password" displayed

**Actual Result:** Pass

---

### TC-04: Empty Form Submission
**Steps:**
1. Navigate to `/Account/Login`
2. Leave email and password fields empty
3. Click "Login"

**Expected Result:** Validation errors for required fields

**Actual Result:** Pass

---

### TC-05: Invalid Email Format
**Steps:**
1. Navigate to `/Account/Login`
2. Enter email: `notanemail`
3. Enter password: `admin123`
4. Click "Login"

**Expected Result:** Email format validation error

**Actual Result:** Pass

---

### TC-06: Session Consistency
**Steps:**
1. Login successfully
2. Navigate to different pages
3. Check session data remains intact

**Expected Result:** User remains authenticated across page navigation

**Actual Result:** Pass

---

#### TC-07: Logout Functionality
**Steps:**
1. Login successfully
2. Click "Logout" button
3. Try accessing protected pages

**Expected Result:** Session cleared, redirected to login page

**Actual Result:** Pass

---

# User Tests

To determine how intuitive and user friendly the web application is, we conducted a test with two people from outside the group. Several tasks were prepared for the testers to attempt

### Test 1: Please report an obstacle with a pin

- **User 1**: Located the "Draw a Marker" button and used it to set a pin. He then filled im the Obstacles type, a short description and then a height
- **User 2**: First attemped to right click on the map like you do with google maps, and when this failed he used the "Draw a Marker button" soon after. This user also submitted a picture

---

### Test 2: Please report an obstacle without using a pin

- **User 1**: Noticed that the Live marker was active the moment he started the form, he then filled the relevant fields and submitted
- **User 2**: Also noticed how the Live marker was already in use, filled in only the required information before sending

---

### Test 3: Please create a draft, and then complete it

- **User 1**: After creating a draft, this user found their way to the "My registration" page where he saw his own draft. The user then completed his draft
- **User 2**: The user created their draft and also found their way to the "My registration" Page, as there were not many other places to go. He then completed his draft

---

## The users were then redirected to the admin page

### Test 4: Please approve a report

- **User 1**: This user quickly found his way to the "Reports & Review page" via the "View Details" button and used the "Quick Approve" feature
- **User 2**: User 2 also found the page easily, but he instead clicked on the "Pending Review" Button and put it on Approved/Published. He then tried to approve the report, but was prompted to write a reason before approving

This showed that the approval process wasnt the most intuitive part of our application

---

### Test 5: Please deny a request

- **User 1**: Clicked the "View Details" button again and used the Quick Reject feature
- **User 2**: He went again to the "Pending Review" Button, changed it to rejected and then wrote a reason before updating

---

### Please sort the reports by their different statuses

- **User 1**: Clicked on the "Approved" Button, before moving on to "Rejected" and "Pending Review"
- **User 2**: This user also found the buttons quite easily, moving from "Rejected" to "Approved into "Pending Review" before finally settling at "Total submitted reports"

---

### Please look at the map and find an obstacle to inspect

- **User 1**: The user found his way to the map section and clicked on one of the rejected reports. He viewed the image and then clicked "View details", sending him back to the "Report Details & Overview" page
- **User 2**: The second user found his way to the map rather quickly, he then zoomed out to see the whole map. The user then selected an obstacle to the north, and since it had no image he clicked on "View details"

---

# Load Testing 
This summarizes the results of load and stress testing performed on the NaviSafe application.
All tests were executed using **West Wind WebSurge** and focused on application performance, endpoint stability,
and request handling under concurrent load.

### Test Configuration
| Setting | Value |
|-------|----------|
| Duration | 60 sec |
| Concurrent Threads | 2 |
| Total Requests | 4,081 |
| Successful Requests | 3,919 |
| Failed Requests | 162 |
| Environment | Localhost (Docker + Aspire) |
| Testing Tool | WebSurge 3.0.3 | 

The entire system ran using .NET Aspire, ensuring all dependent services (Web app, MariaDB, phpMyAdmin) were
orchestrated and healthy throughout the test.

### Performance Summary
| Metric | Result |
|--------|----------------------|
| Avg Response Time | 29.31 ms     |
| Median Response Time | 7.79 ms     |
| 95th Percentile | 278.71 ms     |
| 99th Percentile | 296.29 ms     | 
| Fastest Request | 1.43 ms     |
| Slowest Request | 383.78 ms     |
| Requests per Second | ~68 req/s     |
| Data Served | 102 MB         | 
| Data Posted | 599 KB         |

### Endpoint Analysis
Below is a breakdown of performance for each tested endpoint grouped by expected behaviour.

✔️ **GET Endpoints - Fast and Stable**

| Endpoint                    | Avg (ms)                | Success                | Fail      |
|-----------------------------|-------------------------|------------------------|-----------|                  
| `/`                         | 9.62                    | 471                    | 0         |
| `/Home/AdminDashboard`      | 9.71                    | 471                    | 0         |
| `/Account/Login` (GET)      | 6.11                    | 471                    | 0         |
| `/Account/Register`         | 6.72                    | 157                    | 0         |
| `/Obstacle/Dataform` (GET)  | 6.63                    | 471                    | 0         |
| `/Obstacle/Overview`        | 8.11                    | 471                    | 0         |

**Verdict**:

All GET requests respond consistently under **10 ms**, with **0 failures** across hundreds of requests.
This indicates:
- Stable database reads
- No bottlenecks in routing
- Efficient rendering pipeline
- Minimal server-side overhead

🟡 **POST Endpoints - Mostly Stable**

**POST** `/Account/Logout`

| Avg (ms) | Success | Fail       |
|----------|---------|------------|
| 12.68    | 469     | 2          |

Logout is lightweight and performs well.

**POST** `/Home/UpdateReportStatus/`

| Avg (ms) | Success | Fail       |
|----------|---------|------------|
| 8.48     | 157     | 0          |

Very rapid - this endpoint is efficient and scales well.

⚠️ **POST** `/Account/Login` - **Expected Complex Behaviour**

| Metric                 | Value               |
|------------------------|---------------------|
| Avg Response Time      | 282.67 ms           |
| Max Response Time      | 383.78 ms           |
| 95th Percentile        | 307.92 ms           |
| Success                | 311                 |
| Fail                   | 2                   |

**Verdict**:

Login requests are intentionally slower due to:
- Password hashing
- Database lookups
- Session initialization
- Cookie generation

Which is normal and expected under load.

❌**Faultfinding: POST** `/Obstacle/Dataform`

| Metric                 | Value               |
|------------------------|---------------------|
| Success                | 0                   |
| Failed Requests        | 157                 |
| Avg Response           | 2.07 ms             |

These failures were **not caused by performance issues.**

**Root Cause**

The request contained an invalid image format (APNG), which NaviSafe does not support.

Allowed formats:
- JPEG
- PNG
- GIF
- WEBP

The server rejects unsupported images immediately, explaining the extremely low response times.
This failure confirms that **input validation works successfully.**

---

# Unit Tests

### `HomeControllerTests.cs`

These tests check that the HomeController returns the expected views:

- **Index_Return_ViewResult** – Verifies that the Index action returns a ViewResult.

- **Privacy_Return_ViewResult** – Verifies that the Privacy action returns a ViewResult.

### `ObstacleControllerTests.cs`

These tests cover the basic behavior of the obstacle form:

- **DataForm_Get_Returns_View_Result** – A GET request to DataForm should render the form view.

- **DataForm_Post_Returns_Overview_View_With_Same_Model** – A POST to DataForm with a valid model should return the Overview view and keep the same model instance.

### `ObstacleValidTest.cs`

These tests focus on validation rules for the obstacle model:

- **Obstacle_Name_Required** – If ObstacleName is empty, a validation error with the message “Obstacle name is required” should be produced.

- **Obstacle_Height_cant_be_below_requirement** – If ObstacleHeight is 0.0, the model should produce the error “Height must be between 0.1 and 100.0 meters”.

- **ObstacleHeight_more_than_max_is_invalid** – If ObstacleHeight is above 100.0, the same height error should be produced.

- **Obstacle_Description_Required** – If ObstacleDescription is empty, a validation error with the message “Obstacle description is required” should be produced.

- **Model_has_no_validation_errors** – A fully filled and valid model should not produce any validation errors.

### `UserStorageTests.cs`

These tests verify the logic for registering and validating users in UserStorage.

- **FindsUserIgnoreCase** – Checks that email lookups are case-insensitive, so the same user can be found regardless of upper or lower case in the email.

- **RegisterUserStoresData** – After calling RegisterUser, the method should return a non-empty GUID string and all user fields should be stored correctly, including FullAddress and RegisteredDate.

- **CannotRegisterTheSameEmailTwice** – Registering the same email twice should succeed the first time and then return an empty string on the second call, which means duplicate emails are not allowed.

- **ValidateUserReturnsTrueOnlyIfPasswordIsCorrect** – ValidateUser should return true only when the correct password is provided for a registered email, and false when the password is wrong.

### `AccountControllerTests.cs`

These tests cover the main login and register flows in AccountController.

- **LoginPostReturnsViewIfModelStateIsNotValid** – If ModelState is invalid when posting the login form, the action should return the login view again with the same LoginViewModel instance.

- **LoginPostAddsModelErrorWhenCredentialsAreInvalid** – If the email or password is wrong, the login action should add a model error with the message “Invalid email or password.” and return the login view with the same model.

- **RegisterPostAddsModelErrorWhenEmailAlreadyExists** – If the user tries to register with an email that already exists (for example admin@navisafe.com), the action should add a model error with the message “An account with this email already exists.” and return the register view with the same model.

---

# How to Run The Tests

In Rider, open the Unit Tests tool window and choose Run All Tests for the NaviSafe.Tests project.
All tests should run and show their result there.
