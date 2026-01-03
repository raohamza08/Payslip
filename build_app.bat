@echo off
echo ==============================================
echo      Secure Payslip Manager - Build Script
echo ==============================================
echo.

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed!
    echo Please download and install it from: https://nodejs.org/
    echo.
    pause
    exit /b
)

echo [1/4] Closing background processes...
taskkill /F /IM electron.exe >nul 2>&1
taskkill /F /IM "Payslip Manager.exe" >nul 2>&1
taskkill /F /IM "EurosHub.exe" >nul 2>&1

echo [2/4] Cleaning build directories...
if exist dist-electron (
    rmdir /s /q dist-electron
)
if exist dist (
    rmdir /s /q dist
)
if exist dist-main (
    rmdir /s /q dist-main
)

:: Wait a moment for file locks
timeout /t 2 /nobreak >nul

echo [3/4] Compiling Source Code...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed.
    echo Please check the error messages above.
    pause
    exit /b
)

echo [4/4] Packaging Application (Executables)...
call npm run dist
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed.
    echo Common reasons:
    echo  1. Antivirus blocked the file modification.
    echo  2. Files are open in another program.
    pause
    exit /b
)

echo.
echo ==============================================
echo      Build Complete! 
echo      Check 'dist-electron' folder for the Installer.
echo ==============================================
pause
