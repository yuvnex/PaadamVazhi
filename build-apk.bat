@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   Freebuff Whiteboard - IFP Android 14 APK Builder
echo ========================================================
echo.

echo [1/3] Building Web Distribution (Vite + React)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Web build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Syncing Capacitor Android Assets...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed!
    pause
    exit /b 1
)

:: Ensure OneDrive reparse points are converted to regular local files for Gradle
powershell -NoProfile -Command "Get-ChildItem -Recurse -File 'android\app\src\main\assets' | ForEach-Object { $b = [System.IO.File]::ReadAllBytes($_.FullName); [System.IO.File]::WriteAllBytes($_.FullName, $b) }" 2>nul


echo.
echo [3/3] Compiling Android APK (Target: Android 14 / API 34)...
pushd android
call gradlew.bat assembleDebug
set BUILD_STATUS=%errorlevel%
popd

if %BUILD_STATUS% neq 0 (
    echo.
    echo ========================================================
    echo [ACTION REQUIRED] Android build failed or SDK not found.
    echo.
    echo Please open the project in Android Studio once by running:
    echo    .\open-in-android-studio.bat
    echo.
    echo Android Studio will download any missing Android SDK tools,
    echo and then you can click:
    echo    Build -^> Build Bundle / APK -^> Build APK
    echo ========================================================
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   BUILD SUCCESSFUL!
echo   APK File Location:
echo   android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================================
pause
