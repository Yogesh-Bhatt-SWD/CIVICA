# CIVICA Backend — Spring Boot

AI-Powered Civic Infrastructure Management Platform — Java Spring Boot Backend.

## Prerequisites

- **Java 21** (JDK)
- **Maven 3.9+**
- **MongoDB** running on `localhost:27017`
- **Python AI Service** (optional, for AI image validation) on port `5001`

## Quick Start

### 1. Start MongoDB
```powershell
mongod --dbpath D:\CIVICA\data
```

### 2. Start the Spring Boot Backend
```powershell
cd D:\CIVICA\spring-backend
mvn spring-boot:run
```

The backend starts on **http://localhost:5000**.

### 3. Start the AI Service (optional)
```powershell
cd D:\CIVICA\ai-service
python app.py
```

### 4. Start the Frontend
```powershell
cd D:\CIVICA\frontend
npm run dev
```

Frontend runs on **http://localhost:5173**.

## Sample Test Credentials

On first startup (empty database), the seeder creates:

| Role | Email | Password |
|------|-------|----------|
| Citizen | `citizen@civica.dev` | `password123` |
| Authority | `authority@civica.dev` | `password123` |
| Admin | `admin@civica.dev` | `password123` |

## API Documentation

- **Swagger UI**: http://localhost:5000/swagger-ui.html
- **OpenAPI JSON**: http://localhost:5000/v3/api-docs

## Tech Stack

| Component | Technology |
|-----------|------------|
| Language | Java 21 |
| Framework | Spring Boot 3.3 |
| Security | Spring Security + JWT |
| Database | MongoDB |
| Build | Maven |
| API Docs | SpringDoc OpenAPI (Swagger) |
| PDF | Apache PDFBox |
| AI Integration | REST client to YOLOv8 Flask service |

## Project Structure

```
src/main/java/com/civica/
├── CivicaApplication.java          # Main entry point
├── config/                          # Configuration classes
│   ├── OpenApiConfig.java          # Swagger/OpenAPI
│   └── WebConfig.java             # Static file serving
├── controller/                      # REST controllers
│   ├── AdminController.java
│   ├── AuthController.java
│   ├── AuthorityController.java
│   ├── HealthController.java
│   └── ReportController.java
├── dto/                             # Data Transfer Objects
│   ├── admin/
│   ├── auth/
│   ├── common/
│   └── report/
├── exception/                       # Custom exceptions + global handler
├── model/                           # MongoDB documents
│   ├── GeoJsonPoint.java
│   ├── Report.java
│   ├── Resolution.java
│   └── User.java
├── repository/                      # Spring Data MongoDB repositories
├── security/                        # JWT + Spring Security
│   ├── JwtAuthenticationFilter.java
│   ├── JwtTokenProvider.java
│   └── SecurityConfig.java
├── service/                         # Business logic
│   ├── AdminService.java
│   ├── AiIntegrationService.java
│   ├── AuthService.java
│   ├── AuthorityService.java
│   ├── GravityScoreService.java
│   ├── PdfService.java
│   └── ReportService.java
└── util/
    └── DataSeeder.java             # Initial data seeding
```

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Reports
- `GET /api/reports` — List all reports (paginated, filtered)
- `GET /api/reports/my` — Current user's reports
- `GET /api/reports/categories` — Available categories
- `POST /api/reports` — Create report (multipart)
- `POST /api/reports/validate-image` — AI image validation
- `GET /api/reports/:id` — Get report by ID
- `GET /api/reports/:id/pdf` — Download report PDF
- `PATCH /api/reports/:id/upvote` — Toggle upvote
- `DELETE /api/reports/:id` — Delete report

### Authority
- `GET /api/authority/reports` — Active reports queue
- `PATCH /api/authority/reports/:id/status` — Update status
- `GET /api/authority/reports/:id/resolution` — Get resolution

### Admin
- `GET /api/admin/users` — List users
- `PATCH /api/admin/users/:id/role` — Update user role
- `DELETE /api/admin/users/:id` — Delete user
- `GET /api/admin/analytics` — Platform analytics
- `PATCH /api/admin/reports/:id/status` — Update report status

### Health
- `GET /health` — Health check
