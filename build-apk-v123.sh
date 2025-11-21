#!/bin/bash

echo "🚀 Uploading GabAI v123 to VoltBuilder"
echo "======================================"
echo "✨ What's fixed in v123:"
echo "  ✅ OAuth 404 fixed"
echo "  ✅ Share with group authentication"
echo "  ✅ Contact download fixed"
echo "  ✅ Category field height fixed"
echo "  ✅ JWT expiry validation added"
echo ""

# VoltBuilder credentials
VOLT_USER="f0a6cd88-a42a-4ecf-a01f-49cc11502bb0"
VOLT_PASS="${VOLT_PASSWORD}"

# Check if zip exists
if [ ! -f "gabai-v123.zip" ]; then
    echo "❌ Error: gabai-v123.zip not found"
    exit 1
fi

echo "📦 Uploading gabai-v123.zip to VoltBuilder..."
UPLOAD_RESPONSE=$(curl -X POST \
  "https://api.volt.build/v2/apps/com.gabalabs.gabai" \
  -F "file=@gabai-v123.zip" \
  -u "${VOLT_USER}:${VOLT_PASS}" \
  -s -w "\n%{http_code}")

HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$UPLOAD_RESPONSE" | head -n -1)

echo "Upload response code: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
    echo "❌ Upload failed with HTTP $HTTP_CODE"
    exit 1
fi

echo "✅ Package uploaded successfully"
echo ""
echo "🔨 Starting build..."

BUILD_RESPONSE=$(curl -X POST \
  "https://api.volt.build/v2/apps/com.gabalabs.gabai/build" \
  -d "platform=android" \
  -u "${VOLT_USER}:${VOLT_PASS}" \
  -s)

echo "Build response: $BUILD_RESPONSE"
echo ""
echo "✅ Build initiated! Check https://volt.build/ for status"
echo "📱 APK will be available as: gabai.debug.v3.0.123"
