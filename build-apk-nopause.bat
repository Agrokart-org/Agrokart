@echo off
echo Building Agrokart Android APK...
cd client
call npm run build
if %errorlevel% neq 0 (
    echo React build failed!
    exit /b 1
)
call npx cap sync android
if %errorlevel% neq 0 (
    echo Capacitor sync failed!
    exit /b 1
)
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo Android build failed!
    exit /b 1
)
cd ..\..
copy client\android\app\build\outputs\apk\debug\app-debug.apk Agrokart-LATEST.apk
echo APK Build Completed Successfully!
