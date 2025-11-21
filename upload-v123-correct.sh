#!/bin/bash

echo "🚀 Uploading GabAI v123 to VoltBuilder (CORRECT FORMAT)"
echo "======================================================="

if [ ! -f "gabai-v123.zip" ]; then
    echo "❌ Error: gabai-v123.zip not found"
    exit 1
fi

# Parse credentials
IFS=':' read -r CLIENT_ID CLIENT_SECRET <<< "${Voltbuiler}"

echo "Client ID: ${CLIENT_ID:0:20}..."
echo ""
echo "📝 Step 1: Authenticating with form-urlencoded..."

AUTH_RESPONSE=$(curl -s -X POST \
  "https://api.volt.build/v1/authenticate" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}")

echo "Auth response: $AUTH_RESPONSE"

ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Authentication failed"
    echo "Full response: $AUTH_RESPONSE"
    exit 1
fi

echo "✅ Got access token!"
echo ""
echo "📦 Step 2: Uploading gabai-v123.zip..."

BUILD_RESPONSE=$(curl -s -X POST \
  "https://api.volt.build/v1/app" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "platform=android" \
  -F "app=@gabai-v123.zip;type=application/zip")

echo "Build response:"
echo "$BUILD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$BUILD_RESPONSE"
echo ""

if echo "$BUILD_RESPONSE" | grep -q '"status"'; then
    echo "✅ Build submitted successfully!"
    echo ""
    echo "⏳ Checking status in 15 seconds..."
    sleep 15
    
    STATUS=$(curl -s -X GET \
      "https://api.volt.build/v1/app" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}")
    
    echo "Build status:"
    echo "$STATUS" | python3 -m json.tool 2>/dev/null || echo "$STATUS"
    echo ""
    echo "🎯 Building: gabai.debug.v3.0.123"
    echo "📱 Will be ready in ~2-3 minutes at https://volt.build/"
else
    echo "⚠️ Unexpected response - check VoltBuilder dashboard"
fi
