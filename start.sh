#!/bin/bash

echo "🚀 Starting ERKOS Security Dashboard - Enhanced Edition"
echo "=================================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝 Please copy .env.example to .env and configure your settings"
    echo ""
    read -p "Do you want to create .env from .env.example? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.example .env
        echo "✅ Created .env file - please edit it with your database credentials"
        echo "Press any key to continue after editing .env..."
        read -n 1 -s
    else
        echo "❌ Cannot start without .env file. Exiting..."
        exit 1
    fi
fi

echo ""
echo "✅ Starting server..."
echo "📊 Dashboard will be available at: http://localhost:3001"
echo "=================================================="
echo ""

npm start
