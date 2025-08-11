#!/bin/bash
echo "Building for deployment..."
npm run build

echo "Copying PWA files..."
cp public/manifest.json dist/public/
cp public/sw.js dist/public/
cp -r public/icons dist/public/

echo "Deployment build ready!"
echo "Manifest display mode: $(grep '"display":' dist/public/manifest.json)"
echo "Viewport in HTML: $(grep 'viewport.*viewport-fit=cover' dist/public/index.html > /dev/null && echo 'ENHANCED' || echo 'BASIC')"
