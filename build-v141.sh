#!/bin/bash

set -e  # Exit on error

echo "🚀 Building GabAI v141 for VoltBuilder"
echo "======================================"

VERSION="141"
ZIP_NAME="gabai-v${VERSION}.zip"

# Step 1: Build the frontend using Vite
echo "📦 Step 1: Building frontend with Vite..."
vite build --outDir www

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build complete (www directory created)"

# Step 3: Create zip package for VoltBuilder
echo "📦 Step 3: Creating zip package..."

# Remove old zip if exists
rm -f "${ZIP_NAME}"

# Create zip with essential files
zip -r "${ZIP_NAME}" \
  config.xml \
  www/ \
  icon.png \
  network_security_config.xml \
  voltbuilder.json \
  package-voltbuilder.json \
  -x "*.DS_Store" \
  -x "*node_modules/*" \
  -x "*.git/*"

if [ $? -ne 0 ]; then
    echo "❌ Zip creation failed!"
    exit 1
fi

ZIP_SIZE=$(du -h "${ZIP_NAME}" | cut -f1)
echo "✅ Zip package created: ${ZIP_NAME} (${ZIP_SIZE})"

# Step 4: Upload to VoltBuilder using OAuth2
echo "📤 Step 4: Uploading to VoltBuilder..."

# Get credentials from environment (note: secret is named "Voltbuiler" with typo)
VOLT_CREDS="${Voltbuiler}"
if [ -z "$VOLT_CREDS" ]; then
    echo "❌ Voltbuiler environment variable not set"
    exit 1
fi

# Parse client_id:client_secret
IFS=':' read -r CLIENT_ID CLIENT_SECRET <<< "$VOLT_CREDS"

# Step 4a: Get OAuth2 access token
echo "🔑 Getting OAuth2 token..."
TOKEN_RESPONSE=$(curl -s -X POST "https://api.volt.build/v1/authenticate" \
  -H "Content-Type: application/json" \
  -d "{\"client_id\":\"${CLIENT_ID}\",\"client_secret\":\"${CLIENT_SECRET}\"}")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Failed to get access token"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Got access token: ${ACCESS_TOKEN:0:10}..."

# Step 4b: Upload the zip file
echo "📤 Uploading ${ZIP_NAME} to VoltBuilder..."

UPLOAD_RESPONSE=$(curl -s -X POST "https://api.volt.build/v1/build" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "file=@${ZIP_NAME}" \
  -F "platform=android" \
  -F "build_type=release")

echo "Upload response:"
echo "$UPLOAD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPLOAD_RESPONSE"

# Check if upload was successful
if echo "$UPLOAD_RESPONSE" | grep -q '"build_id"'; then
    BUILD_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"build_id":"[^"]*' | cut -d'"' -f4)
    echo ""
    echo "✅ Upload successful!"
    echo "📋 Build ID: $BUILD_ID"
    echo "🔗 Check build status at: https://volt.build/builds/${BUILD_ID}"
    echo ""
    echo "📱 APK will be available at:"
    echo "   https://volt.build/download/${BUILD_ID}/android"
else
    echo "❌ Upload may have failed. Check response above."
fi

echo ""
echo "🎉 Build v${VERSION} process complete!"
