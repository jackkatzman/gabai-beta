#!/bin/bash
echo "🚀 Creating GabAi v119 with LATEST build..."

# Clean up
rm -rf apk-build-v119 gabai-v119.zip

# Create directory structure
mkdir -p apk-build-v119/www

# Copy LATEST built frontend directly to www/
echo "📦 Copying latest frontend to www/..."
cp -r dist/public/* apk-build-v119/www/

# Copy config files to root
echo "⚙️  Copying config files to root..."
cp config.xml apk-build-v119/
cp icon.png apk-build-v119/
cp network_security_config.xml apk-build-v119/
cp package.json apk-build-v119/

# Verify we have the latest JS
echo "🔍 Verifying latest build files:"
ls -lh apk-build-v119/www/assets/*.js | tail -3

# Create the zip
echo "🗜️  Creating gabai-v119.zip..."
cd apk-build-v119
zip -r ../gabai-v119.zip . -x "*.DS_Store" -x "__MACOSX/*"
cd ..

echo "✅ APK v119 created!"
ls -lh gabai-v119.zip

echo ""
echo "📱 This will build as: gabai.debug.v3.0.119"
echo "Version: 3.0.119 (versionCode: 119)"
