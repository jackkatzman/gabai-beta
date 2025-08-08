#!/bin/bash

# GabAi Beta APK Build Script
# This script builds the Android APK for beta testing

set -e  # Exit on any error

echo "🚀 Building GabAi Beta APK..."
echo "================================"

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
    echo "❌ Error: capacitor.config.ts not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Build the web application
echo "📦 Step 1: Building web application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Web build failed!"
    exit 1
fi

echo "✅ Web build complete"

# Step 2: Sync with Capacitor
echo "🔄 Step 2: Syncing with Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed!"
    exit 1
fi

echo "✅ Capacitor sync complete"

# Step 3: Check if Android project exists
if [ ! -d "android" ]; then
    echo "📱 Android project not found. Adding Android platform..."
    npx cap add android
fi

# Step 4: Build the APK
echo "🔨 Step 3: Building Android APK..."
cd android

# Check if gradlew exists and is executable
if [ ! -f "./gradlew" ]; then
    echo "❌ Error: gradlew not found in android directory"
    echo "Please run 'npx cap sync android' first"
    exit 1
fi

chmod +x ./gradlew

# Build debug APK (signed with debug key)
echo "Building debug APK..."
./gradlew assembleDebug

if [ $? -ne 0 ]; then
    echo "❌ APK build failed!"
    exit 1
fi

# Go back to project root
cd ..

# Step 5: Copy APK to downloads directory
APK_SOURCE="android/app/build/outputs/apk/debug/app-debug.apk"
APK_DEST="public/downloads/gabai-beta.apk"

echo "📥 Step 4: Copying APK to downloads..."

if [ ! -f "$APK_SOURCE" ]; then
    echo "❌ Error: APK not found at $APK_SOURCE"
    exit 1
fi

# Ensure downloads directory exists
mkdir -p public/downloads

# Copy the APK
cp "$APK_SOURCE" "$APK_DEST"

if [ $? -ne 0 ]; then
    echo "❌ Failed to copy APK!"
    exit 1
fi

# Step 6: Display results
echo ""
echo "🎉 SUCCESS! Beta APK built successfully!"
echo "================================"
echo "📱 APK Location: $APK_DEST"
echo "📊 File Size: $(du -h "$APK_DEST" | cut -f1)"
echo "🔗 Download URL: https://$(hostname)/downloads/gabai-beta.apk"
echo ""
echo "📋 Next Steps:"
echo "1. Test the APK on Android devices"
echo "2. Share with beta testers"
echo "3. Collect feedback"
echo ""
echo "🔧 Technical Details:"
echo "   - App ID: ai.gabai.app"
echo "   - Version: 1.0.0-beta.1"
echo "   - Min SDK: 24 (Android 7.0)"
echo "   - Target SDK: 33"
echo "   - Signed: Debug key (for testing only)"