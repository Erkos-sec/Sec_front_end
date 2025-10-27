#!/bin/bash

# ERKOS Dashboard Quick Start Script
echo "🚀 Starting ERKOS Security Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   - Visit: https://nodejs.org/"
    echo "   - Or use Homebrew: brew install node"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please ensure the .env file exists with database configuration."
    exit 1
fi

echo "✅ Environment configuration found"

# Start the application
echo "🌟 Starting ERKOS Dashboard on http://localhost:3000"
echo "📊 Dashboard features:"
echo "   - Modern login page"
echo "   - Interactive pie charts"
echo "   - Real-time statistics"
echo "   - Responsive design"
echo ""
echo "Press Ctrl+C to stop the server"
echo "----------------------------------------"

npm start
