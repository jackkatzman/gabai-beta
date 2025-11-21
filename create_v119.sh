#!/bin/bash
echo "🚀 Creating GabAi v119 APK package..."

# Clean up old build
rm -rf apk-build-v119
rm -f gabai-v119.zip

# Create fresh directory
mkdir -p apk-build-v119

# Copy built frontend to www/
echo "📦 Copying frontend to www/..."
cp -r dist/public/* apk-build-v119/
mkdir -p apk-build-v119/www
mv apk-build-v119/* apk-build-v119/www/ 2>/dev/null || true

# Copy config files to root
echo "⚙️  Copying config files to root..."
cp config.xml apk-build-v119/
cp icon.png apk-build-v119/
cp network_security_config.xml apk-build-v119/
cp package.json apk-build-v119/

# Show structure
echo "📋 Structure:"
ls -lh apk-build-v119/

# Create the zip
echo "🗜️  Creating gabai-v119.zip..."
cd apk-build-v119
zip -r ../gabai-v119.zip . -x "*.DS_Store" -x "__MACOSX/*"
cd ..

echo "✅ APK created: gabai-v119.zip"
ls -lh gabai-v119.zip

# Also show version in config.xml
echo ""
echo "📱 Version info from config.xml:"
grep "version=" config.xml | head -1
