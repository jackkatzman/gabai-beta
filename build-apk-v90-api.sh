#!/bin/bash

# GabAI v90 Build Script
echo "🚀 Building GabAI v90 APK with Voice Reminder Fixes"
echo "===================================================="
echo "✨ What's new in v90:"
echo "  ✅ Voice reminder consent checkbox now visible"
echo "  ✅ Phone number input field in main form"
echo "  ✅ Voice/SMS toggle buttons easily accessible"
echo "  ✅ Clear error message when consent not checked"
echo ""

# Try using credentials as basic auth
VOLT_USER="f0a6cd88-a42a-4ecf-a01f-49cc11502bb0"
VOLT_PASS="HqvmdwZZdlNTf2iXaQ1kA2E1O8/v0LhS"

# Check if zip exists
if [ ! -f "gabai-v90.zip" ]; then
    echo "❌ Error: gabai-v90.zip not found"
    exit 1
fi

# Upload the package
echo "📦 Uploading gabai-v90.zip to VoltBuilder..."
UPLOAD_RESPONSE=$(curl -X POST \
  "https://api.volt.build/v2/apps/com.gabalabs.gabai" \
  -F "file=@gabai-v90.zip" \
  -u "${VOLT_USER}:${VOLT_PASS}" \
  -s -w "\n%{http_code}")

HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$UPLOAD_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
    echo "Upload failed with HTTP $HTTP_CODE"
    echo "Trying alternative upload method..."
    
    # Try as Bearer token
    UPLOAD_RESPONSE=$(curl -X POST \
      "https://api.volt.build/v2/apps" \
      -H "Authorization: Bearer ${VOLT_USER}" \
      -F "file=@gabai-v90.zip" \
      -F "app_id=com.gabalabs.gabai" \
      -s -w "\n%{http_code}")
    
    HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | tail -n 1)
    
    if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
        echo "❌ Upload failed. HTTP code: $HTTP_CODE"
        echo "Response: $RESPONSE_BODY"
        exit 1
    fi
fi

echo "✅ Package uploaded"

# Start the build
echo "🔨 Starting build process..."
BUILD_RESPONSE=$(curl -X POST \
  "https://api.volt.build/v2/apps/com.gabalabs.gabai/build" \
  -d "platform=android" \
  -u "${VOLT_USER}:${VOLT_PASS}" \
  -s)

echo "✅ Build initiated"
echo ""
echo "⏳ Waiting for build to complete (usually 2-3 minutes)..."

# Poll for status
ATTEMPT=0
MAX_ATTEMPTS=60

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  sleep 5
  STATUS=$(curl -X GET \
    "https://api.volt.build/v2/apps/com.gabalabs.gabai" \
    -u "${VOLT_USER}:${VOLT_PASS}" \
    -s | grep -o '"build_status":"[^"]*' | cut -d'"' -f4)
  
  if [ "$STATUS" = "complete" ]; then
    echo ""
    echo "✅ Build completed successfully!"
    break
  elif [ "$STATUS" = "error" ]; then
    echo ""
    echo "❌ Build failed. Check VoltBuilder dashboard for details."
    exit 1
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  echo -n "."
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo ""
  echo "⏱️ Build timed out. Attempting download anyway..."
fi

# Download the APK
echo ""
echo "📥 Downloading APK..."
curl -X GET \
  "https://api.volt.build/v2/apps/com.gabalabs.gabai/download/production/android" \
  -u "${VOLT_USER}:${VOLT_PASS}" \
  -o "gabai-v90.apk" \
  -L -s -w "%{http_code}" | tail -n 1 > /tmp/download_status

DOWNLOAD_STATUS=$(cat /tmp/download_status)

if [ "$DOWNLOAD_STATUS" = "200" ]; then
    echo "✅ APK downloaded as: gabai-v90.apk"
    echo ""
    echo "📱 Installation Instructions:"
    echo "1. Transfer gabai-v90.apk to your Android phone"
    echo "2. Enable 'Install from Unknown Sources' in settings"
    echo "3. Install the APK and test the voice reminders!"
    echo ""
    echo "🎯 Voice Reminder Testing:"
    echo "• Go to Reminders page"
    echo "• ALL fields are now visible:"
    echo "  - Phone number input (FIXED!)"
    echo "  - Voice/SMS toggle (FIXED!)"
    echo "  - Consent checkbox (FIXED!)"
else
    echo "⚠️ Download returned status: $DOWNLOAD_STATUS"
    echo "The build may still be processing. Check:"
    echo "https://volt.build/"
fi