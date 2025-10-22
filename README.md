# README Documentation "NaviSafe"

# NaviSafe

![Logo](Documents/NaviSafe_Icon.png)

**NaviSafe** is a web-based solution app developed for **Kartverket** to assist pilots and administrators with safe navigation, flight and coordination.  
It connects tablet users in the field with a central orchestration layer, API services, and a containerized database backend.

---

## Table of Contents
- [About](#-about)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
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

## Architecture
![NaviSafe Architecture](Documents/NaviSafesysdiagram.png)

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

## Getting Started

### Prerequisites
Make sure you have:
- [.NET SDK 9.0+](https://dotnet.microsoft.com/)
- [Docker](https://www.docker.com/)
- [Git](https://git-scm.com/)

---

## Testing
The objective of this **Test Scenario** is to verify that users can submit data, interact with the map, and have their location accurately tracked

Preconditions:
This test scenario assumes the following:
•   The pilot is logged in to their account
•   The pilot has service
•   The pilot is using an IOS Device with Safari or Google Chrome

## TS-01
- **Input**: Submit an obstacle with type, height, a description and a pin.
- **Expected result**: The obstacle is submitted and appears on the map
- **Actual result**: The obstacle is displayed on the map

## TS-02
- **Input**: Submit an Obstacle with Type, Height and Description but without pin
- **Expected result**: the helicopter’s live location will be used instead of the pin
- **Actual result**: Feature not available, the registration goes through, but there is no marker on the map

## TS-03
- **Input**: Submitting just a pin without any fields
- **Expected result**: a pin is dropped and the registration can be completed later
- **Actual result**: Feature not available, you will be asked to fill the fields

## TS-04
Drag and drop a pin on the map
- **Expected result**: A pin is dropped on the map
- **Actual result**: A pin is dropped on the map and the live tracker disappears

## TS-05
Verify the location trackers' accuracy. Three devices were tested after the group noticed a difference in the accuracy of our devices and browsers. 
Expected results: Tracker inaccuracy does not exceed 50 meters
**Actual result**: 
- iPhone 14 Plus’s accuracy constantly changed between 5-31 Meters
- Windows 11 Laptop was tested with Opera GX, giving either 4911 or 22.5 meters and Google Chrome with 128 Meters of inaccuracy
- MacBook M1 Pro had an accuracy of 35 Meters

The iPhone 14 Plus and MacBook's results are satisfactory, while the laptop's range was too unstable.
Note that the group did not have any working iPads available, so an iPhone was used as a substitute 

---

### Installation
Clone and set up the project:

```bash
git clone https://github.com/asklootz/NaviSafe.git
cd NaviSafe
dotnet restore

---