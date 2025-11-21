#!/bin/bash

echo "🚀 Uploading GabAI v123 to VoltBuilder (v1 API)"
echo "================================================"

if [ ! -f "gabai-v123.zip" ]; then
    echo "❌ Error: gabai-v123.zip not found"
    exit 1
fi

# VoltBuilder credentials - split client_id:secret
CLIENT_ID="f0a6cd88-a42a-4ecf-a01f-49cc11502bb0"
CLIENT_SECRET="${VOLT_PASSWORD}"

echo "📝 Step 1: Authenticating with VoltBuilder..."
AUTH_RESPONSE=$(curl -s -X POST \
  "https://api.volt.build/v1/authenticate" \
  -H "Content-Type: application/json" \
  -d "{\"client_id\": \"${CLIENT_ID}\", \"client_secret\": \"${CLIENT_SECRET}\"}")

echo "Auth response: $AUTH_RESPONSE"

# Extract access token
ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Authentication failed. Response:"
    echo "$AUTH_RESPONSE"
    exit 1
fi

echo "✅ Authenticated successfully"
echo ""
echo "📦 Step 2: Uploading gabai-v123.zip..."

BUILD_RESPONSE=$(curl -s -X POST \
  "https://api.volt.build/v1/app" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "project=@gabai-v123.zip" \
  -F "platform=android")

echo "Build response: $BUILD_RESPONSE"

# Check if build was submitted
if echo "$BUILD_RESPONSE" | grep -q "status"; then
    echo "✅ Build submitted successfully!"
    echo ""
    echo "⏳ Checking build status..."
    
    # Wait a bit and check status
    sleep 5
    
    STATUS_RESPONSE=$(curl -s -X GET \
      "https://api.volt.build/v1/app" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}")
    
    echo "Status: $STATUS_RESPONSE"
    echo ""
    echo "📱 Build URL: https://volt.build/"
    echo "🎯 APK will be: gabai.debug.v3.0.123"
else
    echo "⚠️ Build submission response:"
    echo "$BUILD_RESPONSE"
fi
