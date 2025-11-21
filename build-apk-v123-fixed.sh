#!/bin/bash

echo "🚀 Uploading GabAI v123 to VoltBuilder (alternate API)"
echo "====================================================="

VOLT_USER="f0a6cd88-a42a-4ecf-a01f-49cc11502bb0"
VOLT_PASS="${VOLT_PASSWORD}"

if [ ! -f "gabai-v123.zip" ]; then
    echo "❌ Error: gabai-v123.zip not found"
    exit 1
fi

echo "📦 Trying upload to VoltBuilder API..."

# Try the original API format
UPLOAD_RESPONSE=$(curl -X POST \
  "https://api.volt.build/v2/apps" \
  -F "file=@gabai-v123.zip" \
  -F "app_id=com.gabalabs.gabai" \
  -u "${VOLT_USER}:${VOLT_PASS}" \
  -s -w "\n%{http_code}")

HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$UPLOAD_RESPONSE" | head -n -1)

echo "Upload response code: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Upload successful!"
    echo ""
    echo "🔨 Starting build..."
    
    BUILD_RESPONSE=$(curl -X POST \
      "https://api.volt.build/v2/apps/com.gabalabs.gabai/build" \
      -d "platform=android" \
      -u "${VOLT_USER}:${VOLT_PASS}" \
      -s)
    
    echo "Build response: $BUILD_RESPONSE"
    echo "✅ Build initiated!"
else
    echo "Upload failed. Trying with Bearer token..."
    
    UPLOAD_RESPONSE=$(curl -X POST \
      "https://api.volt.build/upload" \
      -H "Authorization: Bearer ${VOLT_USER}" \
      -F "file=@gabai-v123.zip" \
      -F "appId=com.gabalabs.gabai" \
      -s -w "\n%{http_code}")
    
    HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | tail -n 1)
    echo "Bearer token response: $HTTP_CODE"
    echo "$UPLOAD_RESPONSE"
fi

echo ""
echo "📱 Check build status at: https://volt.build/"
