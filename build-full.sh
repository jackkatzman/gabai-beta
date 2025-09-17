#!/bin/bash
echo "🚀 FULL BUILD FOR DEPLOYMENT"
echo "============================"

echo "1. Building frontend with Vite..."
npx vite build

echo "2. Copying frontend to server/public..."
mkdir -p server/public
cp -r dist/public/* server/public/

echo "3. Building backend with esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Full build complete!"