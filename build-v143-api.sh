#!/bin/bash
# GabAI v143 Build Script using VoltBuilder API

echo "🚀 Building GabAI v143 APK"
echo "=========================="
echo "✨ What's new in v143:"
echo "  ✅ Fixed contact picker to prioritize mobile numbers"
echo "  ✅ Better handling of international phone numbers (+XX)"
echo "  ✅ Improved phone number validation"
echo ""

# Check for zip
if [ ! -f "gabai-v143.zip" ]; then
    echo "❌ Error: gabai-v143.zip not found"
    exit 1
fi

echo "📦 Package size: $(ls -lh gabai-v143.zip | awk '{print $5}')"

# Get OAuth token first
echo "🔐 Authenticating with VoltBuilder API..."

# Use the credentials format from the API docs
AUTH_RESPONSE=$(curl -s -X POST \
  "https://api.volt.build/v1/authenticate" \
  -H "Content-Type: application/json" \
  -d "{\"client_id\":\"$VOLT_PASSWORD\",\"client_secret\":\"$VOLT_PASSWORD\"}")

echo "Auth response: $AUTH_RESPONSE"

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "⚠️ No token obtained, trying direct upload..."
    
    # Try direct upload with password as bearer
    echo "📤 Uploading to VoltBuilder..."
    UPLOAD_RESPONSE=$(curl -s -X POST \
      "https://api.volt.build/v1/app" \
      -H "Authorization: Bearer $VOLT_PASSWORD" \
      -F "platform=android" \
      -F "app=@gabai-v143.zip;type=application/zip")
    
    echo "Upload response: $UPLOAD_RESPONSE"
else
    echo "✅ Got token: ${TOKEN:0:20}..."
    
    echo "📤 Uploading to VoltBuilder..."
    UPLOAD_RESPONSE=$(curl -s -X POST \
      "https://api.volt.build/v1/app" \
      -H "Authorization: Bearer $TOKEN" \
      -F "platform=android" \
      -F "app=@gabai-v143.zip;type=application/zip")
    
    echo "Upload response: $UPLOAD_RESPONSE"
fi

echo ""
echo "🔗 Check build status at: https://volt.build/"
