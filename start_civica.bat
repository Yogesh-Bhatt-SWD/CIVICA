@echo off
TITLE Civica Full Stack Starter
COLOR 0A

echo Starting Civica Services...
echo.

:: 1. MongoDB
echo [1/4] Launching MongoDB...
start "Civica-MongoDB" cmd /k "mongod --dbpath D:\CIVICA\data"
timeout /t 3 /nobreak > nul

:: 2. Backend
echo [2/4] Launching Spring Boot Backend...
cd /d D:\CIVICA\spring-backend
start "Civica-Backend" cmd /k "mvn spring-boot:run"
timeout /t 3 /nobreak > nul

:: 3. AI Service
echo [3/4] Launching AI Service...
cd /d D:\CIVICA\ai-service
start "Civica-AI" cmd /k "python app.py"
timeout /t 3 /nobreak > nul

:: 4. Frontend
echo [4/4] Launching React Frontend...
cd /d D:\CIVICA\frontend
start "Civica-Frontend" cmd /k "npm run dev"

echo.
echo All services launched! Please check the terminal windows for any errors.
echo.
pause
