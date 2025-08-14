#!/bin/bash

echo "========================================"
echo "       StudyPal AI - Quick Start"
echo "========================================"
echo

echo "Checking if dependencies are installed..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed!"
fi

echo
echo "Checking environment configuration..."
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local from example..."
    cp ".env.local.example" ".env.local"
    echo
    echo "⚠️  IMPORTANT: Please edit .env.local and add your Groq API key!"
    echo "   Get your free API key at: https://console.groq.com"
    echo
    read -p "Press Enter to continue after setting up your API key..."
fi

echo
echo "Starting StudyPal AI..."
echo "Open your browser to: http://localhost:3000"
echo
npm run dev