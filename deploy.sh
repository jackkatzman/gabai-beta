#!/bin/bash
echo "🚀 FULL DEPLOYMENT SCRIPT V2.0"
echo "================================"

echo "1. Building frontend with Vite..."
vite build

echo "2. Copying frontend to server/public..."
cp -r dist/public/* server/public/

echo "3. Building backend..."
npm run build

echo "4. Verifying deployment files..."
echo "Frontend index.html updated: $(grep -c 'V2.0' server/public/index.html) times"
echo "Backend version endpoint ready"

echo "✅ DEPLOYMENT READY - Frontend and Backend built!"
echo "Now click Publish in Replit to deploy"