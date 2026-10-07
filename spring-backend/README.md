# CIVICA Backend — Spring Boot

AI-Powered Civic Infrastructure Management Platform — Java Spring Boot Backend.

## Prerequisites

- **Java 17+** (JDK)
- **Maven 3.8+**
- **MySQL** running on `localhost:3306` (database `Civica`)
- **Python AI Service** (optional, for AI image validation) on port `5001`

## Quick Start

### 1. Ensure MySQL is running
Ensure your local MySQL server is running on port 3306 with the `Civica` database created.

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
| Language | Java 17+ |
| Framework | Spring Boot 3.3 |
| Security | Spring Security + JWT |
| Database | MySQL (Spring Data JPA / Hibernate) |
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
- `GET /health` — Health check endpoint (returns `{"status": "UP", ...}`)
- `GET /actuator/health` — Actuator compatible health check alias

---

## Production Deployment Guide (Render)

### 1. Create a Web Service on Render
- **Source Code**: Connect your GitHub repository (`CIVICA`).
- **Language / Environment**: `Java` (or Docker)
- **Root Directory**: `spring-backend`
- **Build Command**:
  ```bash
  ./mvnw clean package -DskipTests
  ```
- **Start Command**:
  ```bash
  java -jar target/civica-backend-1.0.0.jar
  ```
- **Health Check Path**: `/health` (or `/actuator/health`)

### 2. Environment Variables to Configure in Render

| Variable | Description | Example / Default |
|---|---|---|
| `SPRING_DATASOURCE_URL` | MySQL JDBC URL with SSL enabled | `jdbc:mysql://<host>:<port>/<db>?useSSL=true&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `SPRING_DATASOURCE_USERNAME` | MySQL database username | `root` |
| `SPRING_DATASOURCE_PASSWORD` | MySQL database password | `your_db_password` |
| `FRONTEND_URL` | Deployed Vercel frontend URL | `https://your-civica-frontend.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | Additional allowed origins (optional) | `https://*.vercel.app` |
| `JWT_SECRET` | Strong secret for signing tokens | `min_32_characters_random_secure_key` |
| `JWT_EXPIRATION` | Token validity in ms (optional) | `604800000` (7 days) |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | `GOCSPX-xxxx` |
| `OAUTH2_REDIRECT_URI` | OAuth callback target (optional) | Defaults to `${FRONTEND_URL}/oauth-success` |
| `AI_SERVICE_URL` | Deployed Flask AI service URL (optional)| `https://your-ai-service.onrender.com` |
| `FILE_UPLOAD_DIR` | Image uploads storage directory | `./uploads` |

*(Note: Render automatically sets the `PORT` variable, and Spring Boot is configured to read it via `${PORT:5000}`)*

### 3. Configure Google OAuth 2.0 for Production
In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
1. **Authorized JavaScript origins**:
   - `https://your-civica-frontend.vercel.app`
2. **Authorized redirect URIs**:
   - `https://<YOUR-RENDER-BACKEND-DOMAIN>/login/oauth2/code/google`

### 4. Connect Deployed Backend to Vercel Frontend
In your **Vercel Project Dashboard** -> **Settings** -> **Environment Variables**:
- `VITE_API_URL` = `https://<YOUR-RENDER-BACKEND-DOMAIN>/api`
- `VITE_BACKEND_URL` = `https://<YOUR-RENDER-BACKEND-DOMAIN>`

Redeploy the frontend in Vercel to apply the updated environment variables.
