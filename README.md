# CIVICA — AI-Powered Urban Civic Issue Detection

An intelligent civic issue reporting and management platform that uses **YOLOv8** computer vision to automatically detect urban infrastructure problems from uploaded images.

## Features

- **AI-Powered Detection** — Automatically identifies Potholes, Road Cracks, Fallen Trees, Damaged Electrical Poles, and Garbage from images using a custom-trained YOLOv8 model
- **Citizen Reporting** — Users can upload images, select categories, and submit reports with geolocation
- **Admin Dashboard** — View, filter, and manage all reported issues with analytics
- **Real-time Status Tracking** — Track issue resolution progress from reported → in progress → resolved
- **Interactive Map** — Leaflet-based map visualization of reported issues

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite, React Router, Recharts, Leaflet |
| Backend | Node.js + Express, MongoDB + Mongoose |
| AI Service | Python + Flask, YOLOv8 (Ultralytics), OpenCV |
| Auth | JWT-based authentication with bcrypt |

## Project Structure

```
CIVICA/
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express API
├── ai-service/        # Python Flask AI detection service
├── start_civica.bat   # One-click launcher (all services)
└── DATABASE.md        # MongoDB setup guide
```

## Prerequisites

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

**Backend:**
```bash
cd backend
npm install
```

**AI Service:**
```bash
cd ai-service
pip install -r requirements.txt
```

### 3. Configure environment

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/civica
JWT_SECRET=your_jwt_secret
```

### 4. Add model weights

Place your trained `best.pt` model file in the `ai-service/` directory.

> The `yolov8n.pt` base model will be auto-downloaded by Ultralytics on first run.

### 5. Run all services

**Option A — One-click (Windows):**
```bash
start_civica.bat
```

**Option B — Manual:**
```bash
# Terminal 1: MongoDB
mongod --dbpath ./data

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: AI Service
cd ai-service && python app.py

# Terminal 4: Frontend
cd frontend && npm run dev
```

## Detection Categories

| Category | Description |
|----------|-------------|
| Potholes & Road Cracks | Road surface damage |
| Fallen Trees | Fallen or uprooted trees on roads |
| Damaged Electrical Poles | Damaged or leaning poles |
| Garbage | Illegal dumping and waste |

## License

This project is for educational purposes.