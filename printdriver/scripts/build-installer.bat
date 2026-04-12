@echo off
setlocal

echo ========================================
echo PrintDriver Installer Build Script
echo ========================================

REM Check for Inno Setup (prefer version 5 for MinVersion 6.0 support)
set ISCC=""
if exist "C:\Program Files (x86)\Inno Setup 5\ISCC.exe" (
    set ISCC="C:\Program Files (x86)\Inno Setup 5\ISCC.exe"
) else if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    set ISCC="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
) else if exist "C:\Program Files\Inno Setup 6\ISCC.exe" (
    set ISCC="C:\Program Files\Inno Setup 6\ISCC.exe"
) else (
    echo Error: Inno Setup not found
    echo Please download from https://jrsoftware.org/isdownload.php
    pause
    exit /b 1
)

REM Build program
echo.
echo [1/5] Building program...
call "%~dp0build-exe.bat"
if %ERRORLEVEL% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

REM Check if certificate exists
if not exist "%~dp0..\cert\PrintDriver.pfx" (
    echo.
    echo [2/5] Creating self-signed certificate...
    echo This requires administrator privileges.
    echo Please click Yes on the UAC prompt.
    powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0create-cert.ps1\"' -Verb RunAs -Wait"
    if not exist "%~dp0..\cert\PrintDriver.pfx" (
        echo Certificate creation failed!
        pause
        exit /b 1
    )
) else (
    echo.
    echo [2/5] Using existing certificate...
)

REM Sign exe
echo.
echo [3/5] Signing program...
powershell -ExecutionPolicy Bypass -File "%~dp0sign-exe.ps1" -ExePath "%~dp0..\build\PrintDriver.exe" -PfxPath "%~dp0..\cert\PrintDriver.pfx"
if %ERRORLEVEL% neq 0 (
    echo Signing failed!
    pause
    exit /b 1
)

REM Create output directory
if not exist "%~dp0..\output" mkdir "%~dp0..\output"

REM Copy exe to output
echo.
echo [4/5] Copying files to output...
copy /Y "%~dp0..\build\PrintDriver.exe" "%~dp0..\output\PrintDriver.exe" >nul

REM Build installer
echo.
echo [5/5] Building installer...
%ISCC% "%~dp0..\installer\PrintDriver.iss"
if %ERRORLEVEL% neq 0 (
    echo Installer build failed!
    pause
    exit /b 1
)

REM Sign installer
echo.
echo Signing installer...
powershell -ExecutionPolicy Bypass -File "%~dp0sign-exe.ps1" -ExePath "%~dp0..\output\PrintDriver-Setup.exe"

REM Generate printdriver.json
echo.
echo Generating printdriver.json...
powershell -ExecutionPolicy Bypass -File "%~dp0gen-json.ps1"

echo.
echo ========================================
echo Build complete!
echo Output files:
echo   - output\PrintDriver.exe
echo   - output\PrintDriver-Setup.exe
echo   - output\printdriver.json
echo ========================================
pause
