# CIVICA — AI-Powered Urban Civic Issue Detection

An intelligent civic issue reporting and management platform that uses **YOLOv8** computer vision to automatically detect urban infrastructure problems from uploaded images.

## Features

- **AI-Powered Detection** — Automatically identifies Potholes, Road Cracks, Fallen Trees, Damaged Electrical Poles, and Garbage from images using a custom-trained YOLOv8 model
- **Citizen Reporting** — Users can upload images, select categories, and submit reports with geolocation
- **Authority Dashboard** — Assigned authorities can update issue status and manage resolutions
- **Admin Dashboard** — Full platform management with user roles, analytics, and report oversight
- **Real-time Status Tracking** — Track issue resolution progress from reported → in progress → resolved
- **Interactive Map** — Leaflet-based map visualization of geo-tagged reported issues
- **PDF Reports** — Automated report generation with QR codes using Apache PDFBox
- **Gravity Scoring** — AI-driven priority scoring system based on severity, upvotes, and age

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite 8, React Router v7, Recharts, Leaflet, Vanilla CSS |
| Backend | Java 17, Spring Boot 3.3, Spring Security, Spring Data MongoDB |
| AI Service | Python + Flask, YOLOv8 (Ultralytics), PIL/Pillow |
| Database | MongoDB (NoSQL) |
| Auth | JWT-based authentication (jjwt) with Spring Security |
| PDF/QR | Apache PDFBox, ZXing |

## Project Structure

```
CIVICA/
├── frontend/           # React 19 + Vite frontend (SPA)
├── spring-backend/     # Spring Boot 3.3 REST API
├── ai-service/         # Python Flask AI detection service
├── start_civica.bat    # One-click launcher (all services)
└── DATABASE.md         # MongoDB setup guide
```

## Prerequisites

- **Java** 17+
- **Maven** 3.8+
- **Node.js** v18+
- **Python** 3.9+
- **MongoDB** (local instance)
- **YOLOv8 Model Weights** — `best.pt` (place in `ai-service/`)

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/Yogesh-Bhatt-SWD/CIVICA.git
cd CIVICA
```

### 2. Install dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend (Spring Boot):**
> No manual install needed — Maven downloads dependencies automatically on first run.

**AI Service:**
```bash
cd ai-service
pip install -r requirements.txt
```

### 3. Configure

Backend configuration is in `spring-backend/src/main/resources/application.yml`:
```yaml
server:
  port: 5000

spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/civica

jwt:
  secret: civica_super_secret_jwt_key_2024
  expiration: 604800000  # 7 days

ai:
  service:
    url: http://127.0.0.1:5001
```

### 4. Add model weights

Place your trained `best.pt` model file in the `ai-service/` directory.

### 5. Run all services

**Option A — One-click (Windows):**
```bash
start_civica.bat
```

**Option B — Manual:**
```bash
# Terminal 1: MongoDB
mongod --dbpath ./data

# Terminal 2: Spring Boot Backend
cd spring-backend && mvn spring-boot:run

# Terminal 3: AI Service
cd ai-service && python app.py

# Terminal 4: Frontend
cd frontend && npm run dev
```

### 6. Access the app

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Swagger UI | http://localhost:5000/swagger-ui.html |
| AI Service | http://localhost:5001 |

## API Endpoints (25 total)

| Controller | Endpoints | Description |
|-----------|-----------|-------------|
| Auth | 3 | Register, Login, Get current user |
| Reports | 10 | CRUD, image validation, PDF, upvote, categories |
| Admin | 4 | User management, role updates, analytics |
| Authority | 3 | View assigned reports, update status, resolutions |
| Health | 1 | Health check |
| AI Service | 3 | Image validation, URL validation, health |

## Detection Categories

| Category | Description |
|----------|-------------|
| Potholes & Road Cracks | Road surface damage |
| Fallen Trees | Fallen or uprooted trees on roads |
| Damaged Electrical Poles | Damaged or leaning poles |
| Garbage | Illegal dumping and waste |

## User Roles

| Role | Access |
|------|--------|
| **Citizen** | Submit reports, track status, upvote issues |
| **Authority** | Manage assigned area reports, update resolutions |
| **Admin** | Full platform control, user management, analytics |

## License

This project is for educational purposes.