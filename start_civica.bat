@echo off
TITLE Civica Full Stack Starter
COLOR 0A

echo Starting Civica Services (MySQL Database)...
echo.

:: 1. Backend
echo [1/3] Launching Spring Boot Backend (MySQL)...
cd /d D:\CIVICA\spring-backend
start "Civica-Backend" cmd /k "mvn spring-boot:run"
timeout /t 4 /nobreak > nul

:: 2. AI Service
echo [2/3] Launching AI Service...
cd /d D:\CIVICA\ai-service
start "Civica-AI" cmd /k "python app.py"
timeout /t 3 /nobreak > nul

:: 3. Frontend
echo [3/3] Launching React Frontend...
cd /d D:\CIVICA\frontend
start "Civica-Frontend" cmd /k "npm run dev"

echo.
echo All services launched! Please check the terminal windows for any errors.
echo.
pause
