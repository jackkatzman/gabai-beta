#!/bin/bash
set -euo pipefail  # Exit on error, undefined variables, and pipe failures

echo "🚀 FULL BUILD FOR DEPLOYMENT"
echo "============================"
echo "📍 Build environment:"
echo "  - NODE_ENV: ${NODE_ENV:-production}"
echo "  - Working directory: $(pwd)"

# Ensure we're in production mode
export NODE_ENV=production

echo ""
echo "1. Building frontend with Vite..."
npx vite build

echo ""
echo "2. Verifying frontend build output..."
if [ ! -d "dist/public" ]; then
    echo "❌ ERROR: dist/public directory not found after build!"
    echo "Current directory structure:"
    ls -la
    exit 1
fi

echo "📁 Frontend build contents:"
ls -la dist/public/

echo ""
echo "3. Building backend with esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify

echo ""
echo "4. Verifying backend build output..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ ERROR: dist/index.js not found after build!"
    echo "Contents of dist directory:"
    ls -la dist/
    exit 1
fi

echo ""
echo "5. Creating health check file..."
echo '{"status": "ok", "build": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'> dist/public/build-info.json

echo ""
echo "✅ Full build complete!"
echo "📦 Build artifacts:"
echo "  - Frontend: dist/public/ ($(du -sh dist/public | cut -f1))"
echo "  - Backend: dist/index.js ($(du -sh dist/index.js | cut -f1))"
echo ""
echo "🚀 Ready for deployment!"