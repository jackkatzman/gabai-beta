#!/bin/bash

echo "🚀 Uploading GabAI v123 to VoltBuilder"
echo "======================================"

if [ ! -f "gabai-v123.zip" ]; then
    echo "❌ Error: gabai-v123.zip not found"
    exit 1
fi

# Parse credentials
IFS=':' read -r CLIENT_ID CLIENT_SECRET <<< "${Voltbuiler}"

echo "📝 Step 1: Authenticating..."
AUTH_RESPONSE=$(curl -s -X POST \
  "https://api.volt.build/v1/authenticate" \
  -H "Content-Type: application/json" \
  -d "{\"client_id\": \"${CLIENT_ID}\", \"client_secret\": \"${CLIENT_SECRET}\"}")

echo "Auth response: $AUTH_RESPONSE"

ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Authentication failed"
    exit 1
fi

echo "✅ Authenticated!"
echo ""
echo "📦 Step 2: Uploading gabai-v123.zip..."

BUILD_RESPONSE=$(curl -s -X POST \
  "https://api.volt.build/v1/app" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "project=@gabai-v123.zip" \
  -F "platform=android")

echo "Build response:"
echo "$BUILD_RESPONSE"
echo ""

if echo "$BUILD_RESPONSE" | grep -q '"status"'; then
    echo "✅ Build submitted successfully!"
    echo ""
    echo "⏳ Waiting 10 seconds before checking status..."
    sleep 10
    
    STATUS_RESPONSE=$(curl -s -X GET \
      "https://api.volt.build/v1/app" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}")
    
    echo "Build status:"
    echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
    echo ""
    echo "🎯 APK will be available as: gabai.debug.v3.0.123"
    echo "📱 Download at: https://volt.build/"
else
    echo "⚠️ Upload may have issues. Check VoltBuilder dashboard."
fi
