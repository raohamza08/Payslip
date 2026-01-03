@echo off
echo ==============================================
echo   Payslip Manager - FULL REBUILD
echo ==============================================
echo.
echo This will:
echo  1. Stop all running instances
echo  2. Clean all caches
echo  3. Rebuild everything
echo  4. Start fresh server
echo.
pause

echo [1/6] Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo [2/6] Cleaning build directories...
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron
if exist dist-main rmdir /s /q dist-main
if exist dist-preload rmdir /s /q dist-preload
if exist .vite rmdir /s /q .vite

echo [3/6] Installing dependencies...
call npm install

echo [4/6] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b
)

echo [5/6] Verifying logo file...
if exist server\assets\logo.png (
    echo ✓ Logo file found
) else (
    echo ✗ Logo file missing!
    pause
    exit /b
)

echo [6/6] Starting server...
echo.
echo ================================================
echo   Application running at: http://localhost:3000
echo   Press Ctrl+C to stop the server
echo ================================================
echo.
echo IMPORTANT: The logo and email should now work!
echo Check the terminal for [PDF] and [EMAIL] logs
echo.
start http://localhost:3000
npm start
