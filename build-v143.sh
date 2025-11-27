#!/bin/bash
# GabAI v143 Build Script - Contact Picker Fix

echo "🚀 Building GabAI v143 APK"
echo "=========================="
echo "✨ What's new in v143:"
echo "  ✅ Fixed contact picker to prioritize mobile numbers"
echo "  ✅ Better handling of international phone numbers (+XX)"  
echo "  ✅ Improved phone number validation"
echo "  ✅ Better debugging for contact picker issues"
echo ""

# VoltBuilder credentials from environment
VOLT_PASS="${VOLT_PASSWORD}"

if [ -z "$VOLT_PASS" ]; then
    echo "❌ VOLT_PASSWORD not set"
    exit 1
fi

# Check if zip exists
if [ ! -f "gabai-v143.zip" ]; then
    echo "❌ Error: gabai-v143.zip not found"
    exit 1
fi

echo "📦 Package size: $(ls -lh gabai-v143.zip | awk '{print $5}')"

# Upload and build using VoltBuilder API
echo "📤 Uploading to VoltBuilder..."

UPLOAD_RESPONSE=$(curl -s -X POST \
  "https://build.voltbuilder.com/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@gabai-v143.zip" \
  -F "password=${VOLT_PASS}" \
  -F "platform=android" \
  -F "build_type=debug")

echo "Response: $UPLOAD_RESPONSE"

# Check for build ID in response
BUILD_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"id":[0-9]*' | cut -d: -f2)

if [ -n "$BUILD_ID" ]; then
    echo "✅ Build started with ID: $BUILD_ID"
    echo "🔗 Check status at: https://volt.build/"
else
    echo "⚠️ Upload response received, check VoltBuilder dashboard"
    echo "🔗 Go to: https://volt.build/"
fi
