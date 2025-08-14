@echo off
echo ========================================
echo       StudyPal AI - Quick Start
echo ========================================
echo.

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
) else (
    echo Dependencies already installed!
)

echo.
echo Checking environment configuration...
if not exist ".env.local" (
    echo Creating .env.local from example...
    copy ".env.local.example" ".env.local"
    echo.
    echo ⚠️  IMPORTANT: Please edit .env.local and add your Groq API key!
    echo    Get your free API key at: https://console.groq.com
    echo.
    pause
)

echo.
echo Starting StudyPal AI...
echo Open your browser to: http://localhost:3000
echo.
npm run dev