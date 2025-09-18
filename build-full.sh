#!/bin/bash
set -euo pipefail  # Exit on error, undefined variables, and pipe failures

echo "🚀 FULL BUILD FOR DEPLOYMENT"
echo "============================"

echo "1. Building frontend with Vite..."
npx vite build

echo "2. Verifying frontend build output..."
if [ ! -d "dist/public" ]; then
    echo "❌ ERROR: dist/public directory not found after build!"
    exit 1
fi

echo "📁 Frontend build contents:"
ls -la dist/public/

echo "3. Building backend with esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "4. Verifying backend build output..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ ERROR: dist/index.js not found after build!"
    exit 1
fi

echo "✅ Full build complete!"
echo "📦 Build artifacts:"
echo "  - Frontend: dist/public/"
echo "  - Backend: dist/index.js"