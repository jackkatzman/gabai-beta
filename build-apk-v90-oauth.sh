#!/bin/bash

# GabAI v90 Build Script - Using OAuth credentials
VOLTBUILDER_CLIENT_ID="f0a6cd88-a42a-4ecf-a01f-49cc11502bb0"
VOLTBUILDER_CLIENT_SECRET="HqvmdwZZdlNTf2iXaQ1kA2E1O8/v0LhS"

echo "🚀 Building GabAI v90 APK with Voice Reminder Fixes"
echo "===================================================="
echo "✨ What's new in v90:"
echo "  ✅ Voice reminder consent checkbox now visible"
echo "  ✅ Phone number input field in main form"
echo "  ✅ Voice/SMS toggle buttons easily accessible"
echo "  ✅ Clear error message when consent not checked"
echo ""

# Check if zip file exists
if [ ! -f "gabai-v90.zip" ]; then
    echo "❌ Error: gabai-v90.zip not found"
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
echo "📦 Uploading gabai-v90.zip to VoltBuilder..."
BUILD_RESPONSE=$(curl -s -X POST \
    https://api.volt.build/app \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -F "file=@gabai-v90.zip" \
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
            curl -L -o "gabai-v90.apk" "$DOWNLOAD_URL"
            echo "✅ APK downloaded as: gabai-v90.apk"
            echo ""
            echo "📲 Installation Steps:"
            echo "1. Transfer gabai-v90.apk to your Android phone"
            echo "2. Install the APK (enable 'Unknown sources' if needed)"
            echo ""
            echo "🎯 Test the Voice Reminder Fixes:"
            echo "• Open the Reminders page"
            echo "• ALL fields are now visible upfront:"
            echo "  - Reminder text input"
            echo "  - Date/time selector"
            echo "  - Phone number field (NEW - visible!)"
            echo "  - Voice/SMS toggle (NEW - visible!)"
            echo "  - Consent checkbox (NEW - visible!)"
            echo "• The submit button will guide you if consent is needed"
        fi
        exit 0
    elif [ "$STATUS" = "error" ]; then
        echo ""
        echo "❌ Build failed!"
        echo "Full response: $STATUS_RESPONSE"
        echo "Check https://volt.build/app/$BUILD_ID for details"
        exit 1
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
done

echo ""
echo "⏱️ Build timed out. Check status at:"
echo "https://volt.build/app/$BUILD_ID"