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
powershell -NoProfile -Command "Get-ChildItem -Recurse -File 'android\app\src\main\assets' | ForEach-Object { $t = [System.IO.Path]::GetTempFileName(); [System.IO.File]::Copy($_.FullName, $t, $true); [System.IO.File]::Delete($_.FullName); [System.IO.File]::Copy($t, $_.FullName); [System.IO.File]::Delete($t) }" 2>nul


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

:: Copy newly compiled APK from temp build directory to project output locations
if exist "%TEMP%\whiteboard-build\app\outputs\apk\debug\app-debug.apk" (
    if not exist "android\app\build\outputs\apk\debug" mkdir "android\app\build\outputs\apk\debug"
    copy /y "%TEMP%\whiteboard-build\app\outputs\apk\debug\app-debug.apk" "android\app\build\outputs\apk\debug\app-debug.apk" >nul
    copy /y "%TEMP%\whiteboard-build\app\outputs\apk\debug\app-debug.apk" "app-debug.apk" >nul
)

echo.
echo ========================================================
echo   BUILD SUCCESSFUL!
echo   Fresh APK has been saved to:
echo     1) app-debug.apk  (in this root folder)
echo     2) android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================================
explorer /select,"app-debug.apk"
pause
