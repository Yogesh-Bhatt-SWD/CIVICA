# MongoDB Service Management

If the MongoDB service stops or fails to connect, follow these steps to restart it.

## 1. Start the MongoDB Service
Open a new terminal (Windows PowerShell or Command Prompt) and run the following command:

```powershell
mongod --dbpath D:\CIVICA\data
```

> [!IMPORTANT]
> **Keep this terminal window open** while you are developing. If you close it, the database will shut down and the login/register functionality will stop working.

## 2. Troubleshooting
- **Error: Address already in use**: This means MongoDB is already running. You can check this by running:
  `tasklist /fi "imagename eq mongod.exe"`
- **Permission Denied**: Run the terminal as **Administrator**.
- **Data directory not found**: Ensure the path `D:\CIVICA\data` is correct and accessible.

## 3. Automation (Optional)
You can create a `start_db.bat` file in the root directory for one-click startup:
```batch
@echo off
mongod --dbpath D:\CIVICA\data
pause
```
