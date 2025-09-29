#!/bin/bash

# Build and upload GabAi v63 APK with UI redesign and camera/mic fixes
# Uses VoltBuilder API to generate APK

echo "🚀 Building GabAi v63 with UI redesign..."

# Check for VoltBuilder credentials
if [ -z "$VOLTBUILDER_CLIENT_ID" ] || [ -z "$VOLTBUILDER_CLIENT_SECRET" ]; then
    echo "❌ Error: Missing VoltBuilder credentials"
    echo "Please set VOLTBUILDER_CLIENT_ID and VOLTBUILDER_CLIENT_SECRET"
    exit 1
fi

# Check if zip file exists
if [ ! -f "gabai-v63-ui-redesign.zip" ]; then
    echo "❌ Error: gabai-v63-ui-redesign.zip not found"
    echo "Run: ./prepare-v63-package.sh first"
    exit 1
fi

# Get auth token
echo "🔑 Authenticating with VoltBuilder..."
AUTH_RESPONSE=$(curl -s -X POST \
    https://api.volt.build/token \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "client_id=$VOLTBUILDER_CLIENT_ID" \
    -d "client_secret=$VOLTBUILDER_CLIENT_SECRET" \
    -d "grant_type=client_credentials")

ACCESS_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Failed to get auth token"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

echo "✅ Authenticated successfully"

# Upload and build
echo "📦 Uploading package to VoltBuilder..."
BUILD_RESPONSE=$(curl -s -X POST \
    https://api.volt.build/app \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -F "file=@gabai-v63-ui-redesign.zip" \
    -F "platform=android" \
    -F "autorelease=false")

BUILD_ID=$(echo $BUILD_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$BUILD_ID" ]; then
    echo "❌ Failed to start build"
    echo "Response: $BUILD_RESPONSE"
    exit 1
fi

echo "✅ Build started with ID: $BUILD_ID"
echo ""
echo "📱 Track your build at:"
echo "https://volt.build/app/$BUILD_ID"
echo ""
echo "🎯 What's new in v63:"
echo "  ✅ Camera now uses native capture (no more stuck on 'capturing')"
echo "  ✅ Microphone recording fixed (no more stuck on 'processing')"
echo "  ✅ Voice-first UI with prominent mic button (2x size)"
echo "  ✅ Cleaner layout with better text input field"
echo "  ✅ Permission dialogs working correctly"
echo ""
echo "⏳ Build usually takes 2-3 minutes..."

# Poll for completion
MAX_ATTEMPTS=60
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    sleep 5
    STATUS_RESPONSE=$(curl -s -X GET \
        "https://api.volt.build/app/$BUILD_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    
    if [ "$STATUS" = "complete" ]; then
        echo ""
        echo "✅ Build complete!"
        DOWNLOAD_URL=$(echo $STATUS_RESPONSE | grep -o '"download_url":"[^"]*' | cut -d'"' -f4)
        
        if [ ! -z "$DOWNLOAD_URL" ]; then
            echo "📥 Downloading APK..."
            curl -L -o "gabai-v63.apk" "$DOWNLOAD_URL"
            echo "✅ APK downloaded as: gabai-v63.apk"
            echo ""
            echo "📲 Next steps:"
            echo "1. Transfer gabai-v63.apk to your Android phone"
            echo "2. Install the APK (enable 'Unknown sources' if needed)"
            echo "3. Test the new UI and camera/mic functionality!"
        fi
        exit 0
    elif [ "$STATUS" = "error" ]; then
        echo ""
        echo "❌ Build failed!"
        echo "Check https://volt.build/app/$BUILD_ID for details"
        exit 1
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
done

echo ""
echo "⏱️ Build timed out. Check status at:"
echo "https://volt.build/app/$BUILD_ID"