#!/bin/bash

# GabAI v90 Build Script - Voice Reminder Fixes
VOLT_USER="jack@gabalabs.ai"
VOLT_APP_ID="com.gabalabs.gabai"

echo "🚀 Building GabAI v90 APK with Voice Reminder Fixes"
echo "===================================================="
echo "✨ What's new in v90:"
echo "  ✅ Voice reminder consent checkbox now visible"
echo "  ✅ Phone number input field in main form"
echo "  ✅ Voice/SMS toggle buttons easily accessible"
echo "  ✅ Clear error message when consent not checked"
echo ""

# Upload the package
echo "📦 Uploading gabai-v90.zip to VoltBuilder..."
UPLOAD_RESPONSE=$(curl -X POST \
  "https://api.volt.build/v2/apps/${VOLT_APP_ID}" \
  -F "file=@gabai-v90.zip" \
  -u "${VOLT_USER}:${VOLT_PASSWORD}" \
  -s)

echo "✅ Package uploaded"

# Start the build
echo "🔨 Starting build process..."
BUILD_RESPONSE=$(curl -X POST \
  "https://api.volt.build/v2/apps/${VOLT_APP_ID}/build" \
  -d "platform=android" \
  -u "${VOLT_USER}:${VOLT_PASSWORD}" \
  -s)

echo "✅ Build initiated"

# Poll for build status
echo "⏳ Waiting for build to complete (usually 2-3 minutes)..."
ATTEMPT=0
MAX_ATTEMPTS=60

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  sleep 5
  STATUS=$(curl -X GET \
    "https://api.volt.build/v2/apps/${VOLT_APP_ID}" \
    -u "${VOLT_USER}:${VOLT_PASSWORD}" \
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
  echo "⏱️ Build timed out. Check VoltBuilder dashboard."
  exit 1
fi

# Download the APK
echo "📥 Downloading APK..."
curl -X GET \
  "https://api.volt.build/v2/apps/${VOLT_APP_ID}/download/production/android" \
  -u "${VOLT_USER}:${VOLT_PASSWORD}" \
  -o "gabai-v90.apk" \
  -L

echo ""
echo "✅ APK downloaded as: gabai-v90.apk"
echo ""
echo "📱 Installation Instructions:"
echo "1. Transfer gabai-v90.apk to your Android phone"
echo "2. Enable 'Install from Unknown Sources' in settings"
echo "3. Install the APK and test the voice reminders!"
echo ""
echo "🎯 Voice Reminder Testing:"
echo "• Go to Reminders page"
echo "• Enter reminder text"
echo "• Set date/time"
echo "• Enter phone number (now visible!)"
echo "• Choose Voice or SMS (now visible!)"
echo "• Check consent box (now visible!)"
echo "• Click 'Set Reminder'"