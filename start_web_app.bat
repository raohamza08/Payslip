@echo off
echo ==============================================
echo      Payslip Manager - Web App Launcher
echo ==============================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed!
    echo Please download and install it from: https://nodejs.org/
    exit /b
)

echo [1/3] Installing Web Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Install failed.
    pause
    exit /b
)

echo [2/3] Building Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b
)

echo [3/3] Starting Web Server...
echo.
echo ================================================
echo   Application running at: http://localhost:3000
echo   Press Ctrl+C to stop the server
echo ================================================
echo.
start http://localhost:3000
npm start
