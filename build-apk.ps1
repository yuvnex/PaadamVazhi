Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Freebuff Whiteboard - IFP Android 14 APK Builder" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Building Web Distribution (Vite + React)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Web build failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/3] Syncing Capacitor Android Assets..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Capacitor sync failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

# Ensure OneDrive reparse points are converted to regular local files for Gradle
Get-ChildItem -Recurse -File "android\app\src\main\assets" | ForEach-Object {
    $t = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::Copy($_.FullName, $t, $true)
    [System.IO.File]::Delete($_.FullName)
    [System.IO.File]::Copy($t, $_.FullName)
    [System.IO.File]::Delete($t)
}


Write-Host ""
Write-Host "[3/3] Compiling Android APK (Target: Android 14 / API 34)..." -ForegroundColor Yellow
Push-Location android
.\gradlew.bat assembleDebug
$gradleStatus = $LASTEXITCODE
Pop-Location

if ($gradleStatus -ne 0) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "[ACTION REQUIRED] Android SDK is not yet initialized." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please open the project in Android Studio once by running:" -ForegroundColor White
    Write-Host "   .\open-in-android-studio.bat" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Android Studio will configure the Android SDK (API 34), and you can click:" -ForegroundColor White
    Write-Host "   Build -> Build Bundle(s) / APK(s) -> Build APK(s)" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Red
    exit 1
}

$tempApk = Join-Path $env:TEMP "whiteboard-build\app\outputs\apk\debug\app-debug.apk"
if (Test-Path $tempApk) {
    New-Item -ItemType Directory -Force -Path "build-output" | Out-Null
    Copy-Item $tempApk "build-output\PaadamVazhi.apk" -Force
    Copy-Item $tempApk "PaadamVazhi.apk" -Force
    Copy-Item $tempApk "app-debug.apk" -Force
    New-Item -ItemType Directory -Force -Path "android\app\build\outputs\apk\debug" | Out-Null
    Copy-Item $tempApk "android\app\build\outputs\apk\debug\app-debug.apk" -Force
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "  APK File: PaadamVazhi.apk (and build-output\PaadamVazhi.apk)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
