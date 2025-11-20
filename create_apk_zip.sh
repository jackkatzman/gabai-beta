#!/bin/bash
set -e

echo "🚀 Creating GabAi APK build..."

# Clean up old builds
rm -rf apk-build gabai-mobile.zip

# Create APK directory structure
mkdir -p apk-build
mkdir -p apk-build/res/icon/android

# Copy built frontend assets
echo "📦 Copying built frontend..."
cp -r dist/public/* apk-build/

# Copy config files
echo "⚙️  Copying config files..."
cp config.xml apk-build/
cp network_security_config.xml apk-build/

# Copy main icon
echo "🎨 Copying icons..."
cp icon.png apk-build/

# Create Android icon resources at proper densities
# We'll use the main icon and resize it (you should have pre-made versions ideally)
cp icon.png apk-build/res/icon/android/icon-36-ldpi.png
cp icon.png apk-build/res/icon/android/icon-48-mdpi.png  
cp icon.png apk-build/res/icon/android/icon-72-hdpi.png
cp icon.png apk-build/res/icon/android/icon-96-xhdpi.png
cp icon.png apk-build/res/icon/android/icon-144-xxhdpi.png
cp icon.png apk-build/res/icon/android/icon-192-xxxhdpi.png

# Create splash screens directory
mkdir -p apk-build/res/screen/android

# List contents
echo "📋 APK build structure:"
ls -la apk-build/
echo ""
echo "📱 Android icons:"
ls -la apk-build/res/icon/android/

# Create ZIP
echo "🗜️  Creating ZIP file..."
cd apk-build
zip -r ../gabai-mobile.zip . -x "*.DS_Store"
cd ..

echo "✅ APK build created: gabai-mobile.zip"
ls -lh gabai-mobile.zip
