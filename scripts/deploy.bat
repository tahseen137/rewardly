@echo off
REM Rewardly Deployment Script for Windows
REM This script helps automate the deployment process

setlocal enabledelayedexpansion

:MAIN
cls
echo ========================================
echo Rewardly Deployment Tool
echo ========================================
echo.

call :CHECK_PREREQUISITES
if errorlevel 1 goto :END

call :CHECK_EAS_LOGIN
if errorlevel 1 goto :END

:MENU
cls
echo ========================================
echo Rewardly Deployment Menu
echo ========================================
echo.
echo 1) Build iOS (Production)
echo 2) Build Android (Production)
echo 3) Build Both Platforms (Production)
echo 4) Build iOS (Preview/Testing)
echo 5) Build Android (Preview/Testing)
echo 6) Submit iOS to App Store
echo 7) Submit Android to Play Store
echo 8) Submit Both Platforms
echo 9) Check Build Status
echo 10) View Latest Builds
echo 11) Run All (Build + Submit Both)
echo 0) Exit
echo.

set /p choice="Enter your choice: "

if "%choice%"=="1" goto :BUILD_IOS_PROD
if "%choice%"=="2" goto :BUILD_ANDROID_PROD
if "%choice%"=="3" goto :BUILD_ALL_PROD
if "%choice%"=="4" goto :BUILD_IOS_PREVIEW
if "%choice%"=="5" goto :BUILD_ANDROID_PREVIEW
if "%choice%"=="6" goto :SUBMIT_IOS
if "%choice%"=="7" goto :SUBMIT_ANDROID
if "%choice%"=="8" goto :SUBMIT_ALL
if "%choice%"=="9" goto :BUILD_STATUS
if "%choice%"=="10" goto :VIEW_BUILDS
if "%choice%"=="11" goto :RUN_ALL
if "%choice%"=="0" goto :END

echo Invalid choice!
pause
goto :MENU

:CHECK_PREREQUISITES
echo Checking Prerequisites...
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js is installed (!NODE_VERSION!)
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] npm is installed (!NPM_VERSION!)
)

where eas >nul 2>&1
if errorlevel 1 (
    echo [WARNING] EAS CLI is not installed
    echo Install with: npm install -g eas-cli
    set /p install="Install EAS CLI now? (y/n): "
    if /i "!install!"=="y" (
        npm install -g eas-cli
    ) else (
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('eas --version') do set EAS_VERSION=%%i
    echo [OK] EAS CLI is installed (!EAS_VERSION!)
)

echo.
exit /b 0

:CHECK_EAS_LOGIN
echo Checking EAS Login...
echo.

eas whoami >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Not logged in to EAS
    echo Please login...
    eas login
    if errorlevel 1 (
        echo [ERROR] Login failed
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('eas whoami') do set EAS_USER=%%i
    echo [OK] Logged in as !EAS_USER!
)

echo.
exit /b 0

:BUILD_IOS_PROD
cls
echo ========================================
echo Building iOS (Production)
echo ========================================
echo.
echo This will take 10-20 minutes...
echo.
eas build --platform ios --profile production
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    goto :MENU
)
echo.
echo [SUCCESS] Build completed!
pause
goto :MENU

:BUILD_ANDROID_PROD
cls
echo ========================================
echo Building Android (Production)
echo ========================================
echo.
echo This will take 10-20 minutes...
echo.
eas build --platform android --profile production
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    goto :MENU
)
echo.
echo [SUCCESS] Build completed!
pause
goto :MENU

:BUILD_ALL_PROD
cls
echo ========================================
echo Building Both Platforms (Production)
echo ========================================
echo.
echo This will take 15-30 minutes...
echo.
eas build --platform all --profile production
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    goto :MENU
)
echo.
echo [SUCCESS] Build completed!
pause
goto :MENU

:BUILD_IOS_PREVIEW
cls
echo ========================================
echo Building iOS (Preview/Testing)
echo ========================================
echo.
eas build --platform ios --profile preview
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    goto :MENU
)
echo.
echo [SUCCESS] Build completed!
pause
goto :MENU

:BUILD_ANDROID_PREVIEW
cls
echo ========================================
echo Building Android (Preview/Testing)
echo ========================================
echo.
eas build --platform android --profile preview
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    goto :MENU
)
echo.
echo [SUCCESS] Build completed!
pause
goto :MENU

:SUBMIT_IOS
cls
echo ========================================
echo Submitting to iOS App Store
echo ========================================
echo.
eas submit --platform ios --latest
if errorlevel 1 (
    echo [ERROR] Submission failed
    pause
    goto :MENU
)
echo.
echo [SUCCESS] Submitted successfully!
pause
goto :MENU

:SUBMIT_ANDROID
cls
echo ========================================
echo Submitting to Google Play Store
echo ========================================
echo.
eas submit --platform android --latest
if errorlevel 1 (
    echo [ERROR] Submission failed
    pause
    goto :MENU
)
echo.
echo [SUCCESS] Submitted successfully!
pause
goto :MENU

:SUBMIT_ALL
cls
echo ========================================
echo Submitting to Both Stores
echo ========================================
echo.
echo Submitting to iOS App Store...
eas submit --platform ios --latest
if errorlevel 1 (
    echo [ERROR] iOS submission failed
    pause
    goto :MENU
)
echo.
echo Submitting to Google Play Store...
eas submit --platform android --latest
if errorlevel 1 (
    echo [ERROR] Android submission failed
    pause
    goto :MENU
)
echo.
echo [SUCCESS] Both submissions completed!
pause
goto :MENU

:BUILD_STATUS
cls
echo ========================================
echo Build Status
echo ========================================
echo.
eas build:list
echo.
pause
goto :MENU

:VIEW_BUILDS
cls
echo ========================================
echo Latest Builds
echo ========================================
echo.
eas build:list --limit 5
echo.
pause
goto :MENU

:RUN_ALL
cls
echo ========================================
echo Full Deployment Process
echo ========================================
echo.
echo This will:
echo 1. Build for both platforms (Production)
echo 2. Submit to both app stores
echo.
set /p confirm="Continue? (y/n): "
if /i not "!confirm!"=="y" goto :MENU

echo.
echo Step 1: Building both platforms...
eas build --platform all --profile production
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    goto :MENU
)

echo.
echo [SUCCESS] Build completed!
echo.
set /p submit="Submit to stores now? (y/n): "
if /i not "!submit!"=="y" goto :MENU

echo.
echo Step 2: Submitting to iOS App Store...
eas submit --platform ios --latest
if errorlevel 1 (
    echo [ERROR] iOS submission failed
)

echo.
echo Step 3: Submitting to Google Play Store...
eas submit --platform android --latest
if errorlevel 1 (
    echo [ERROR] Android submission failed
)

echo.
echo [SUCCESS] Full deployment completed!
pause
goto :MENU

:END
echo.
echo Goodbye!
timeout /t 2 >nul
exit /b 0
