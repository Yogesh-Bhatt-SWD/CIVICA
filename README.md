# CIVICA — AI-Powered Urban Civic Issue Detection

## Problem

Urban areas regularly face civic infrastructure problems such as **potholes, road cracks, fallen trees, damaged electrical poles, and garbage dumping**.

Today, reporting these problems can be difficult for citizens because they may not know:

* Where or how to report the issue.
* Which authority is responsible for resolving it.
* Whether the issue has already been reported.
* What is happening after submitting a complaint.

For authorities, managing these reports can also be challenging because large numbers of complaints need to be **verified, prioritized, assigned, and tracked**. Manually reviewing uploaded images and deciding which issues require immediate attention can make the process slower.

## Solution

**CIVICA** provides a centralized platform where citizens can report urban civic problems using **images and location data**, while authorities can manage and track those issues through their resolution.

The platform uses a custom-trained **YOLOv8 computer vision model trained on 10,000+ images** to automatically analyze uploaded images and detect supported civic issues.

Instead of simply storing a complaint, CIVICA helps turn a citizen's report into an actionable issue:

```text
Citizen Reports Problem
        ↓
Uploads Image + Location
        ↓
YOLOv8 Analyzes Image
        ↓
Civic Issue Detected
        ↓
Category + Severity + Priority
        ↓
Report Created
        ↓
Authority Manages Issue
        ↓
Reported → In Progress → Resolved
        ↓
Citizen Tracks Resolution
```

## What Civic Problems Does CIVICA Handle?

CIVICA focuses on common urban infrastructure and public-area problems:

| Civic Issue                  | What it represents                                      |
| ---------------------------- | ------------------------------------------------------- |
| **Potholes**                 | Damaged road surfaces that can create safety problems   |
| **Road Cracks**              | Cracks and visible deterioration of roads               |
| **Fallen Trees**             | Trees blocking roads or public spaces                   |
| **Damaged Electrical Poles** | Broken, fallen, or leaning electrical poles             |
| **Garbage**                  | Garbage accumulation or illegal dumping in public areas |

## AI-Powered Issue Detection

The main intelligent component of CIVICA is its **YOLOv8 object detection model**.

The model was custom-trained using **10,000+ images** representing the supported civic issue categories.

When a citizen uploads an image, the AI service analyzes it and identifies the detected issue.

```text
Uploaded Image
      ↓
YOLOv8 Model
      ↓
Object Detection
      ↓
Issue Category
      ↓
Detection Confidence
```

This reduces the amount of manual image inspection required during issue reporting and management.

## Citizen Features

Citizens can:

* Register and securely log in.
* Report civic problems using images.
* Provide the issue's geographical location.
* Track their submitted reports.
* View issue status and resolution progress.
* Upvote existing reported issues.
* View reported issues on an interactive map.
* Generate/download PDF reports for issues.

## Authority Features

Authorities can:

* View issues assigned to them.
* Manage reports within their assigned area.
* Review reported issues and their details.
* Update issue status.
* Record resolution information.
* Track issues from reporting to resolution.

## Admin Features

Admins can:

* Manage users and roles.
* Oversee reported civic issues.
* Access platform-level analytics.
* Manage the overall issue-management system.

## Issue Prioritization

Not every civic issue has the same urgency.

CIVICA uses a **gravity/priority scoring system** based on factors such as:

* Issue severity
* Number of community upvotes
* Age of the report

This helps authorities identify issues that may require greater priority.

## Interactive Map

Geo-tagged reports are displayed using an interactive **Leaflet map**, allowing users and authorities to see where civic problems are occurring and identify areas with multiple reported issues.

## Issue Lifecycle

Each report can move through a defined resolution workflow:

```text
Reported
   ↓
In Progress
   ↓
Resolved
```

This gives citizens visibility into what happens after they submit a report and gives authorities a structured way to manage the resolution process.

## Architecture

CIVICA consists of a React frontend, Spring Boot backend, and a separate Python AI service:

```text
                    React Frontend
                          │
                          ▼
                 Spring Boot Backend
                    │           │
                    ▼           ▼
                 MongoDB     AI Service
                                 │
                                 ▼
                            YOLOv8 Model
```

The Spring Boot backend handles authentication, authorization, report management, business logic, prioritization, geolocation data, PDF generation, and communication with the AI service.

The Python Flask service is responsible for image processing and YOLOv8 inference.

## Authentication & Roles

CIVICA uses **JWT-based authentication with Spring Security** and supports three primary roles:

```text
Citizen
  → Report & Track Issues

Authority
  → Manage Assigned Issues

Admin
  → Manage Platform
```

Role-based authorization ensures that each role can access only its permitted functionality.

## Tech Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Frontend   | React 19, Vite 8, React Router, Recharts, Leaflet |
| Backend    | Java 17, Spring Boot 3.3                          |
| Security   | Spring Security, JWT                              |
| Database   | MongoDB, Spring Data MongoDB                      |
| AI Service | Python, Flask, YOLOv8, Ultralytics, Pillow        |
| PDF / QR   | Apache PDFBox, ZXing                              |
| Styling    | Vanilla CSS                                       |

## Project Structure

```text
CIVICA/
├── frontend/           # React frontend
├── spring-backend/     # Spring Boot backend
├── ai-service/         # Python Flask + YOLOv8 service
├── start_civica.bat    # One-click launcher
└── DATABASE.md         # MongoDB setup guide
```

## Prerequisites

* Java 17+
* Maven 3.8+
* Node.js 18+
* Python 3.9+
* MongoDB
* YOLOv8 model weights (`best.pt`)

## Setup

### Clone the Repository

```bash
git clone https://github.com/Yogesh-Bhatt-SWD/CIVICA.git
cd CIVICA
```

### Install Dependencies

Frontend:

```bash
cd frontend
npm install
```

AI Service:

```bash
cd ai-service
pip install -r requirements.txt
```

Maven dependencies are installed automatically when the Spring Boot application is built.

### Add YOLOv8 Model

Place the trained model weights at:

```text
ai-service/best.pt
```

### Run the Application

On Windows:

```bash
start_civica.bat
```

Or run the services individually:

```bash
# Backend
cd spring-backend
mvn spring-boot:run

# AI Service
cd ai-service
python app.py

# Frontend
cd frontend
npm run dev
```

## Project Highlights

CIVICA connects **citizen reporting, AI-based image detection, geolocation, issue prioritization, authority management, and resolution tracking** into a single civic issue management platform.

**The goal is simple: make it easier to report civic problems, easier for authorities to prioritize and manage them, and easier for citizens to track their resolution.**
