#!/bin/bash
set -e

VOLT_USER="jack@gabalabs.ai"
VOLT_APP_ID="com.gabalabs.gabai"

echo "🚀 Building APK v61 (Fixed SMS verification for APK)..."

# 1. Create the zip file
cd voltbuilder-v61
zip -r ../gabai-v61-sms.zip . -x "*.DS_Store"
cd ..

echo "✅ Created gabai-v61-sms.zip"

# 2. Upload to VoltBuilder
echo "📤 Uploading to VoltBuilder..."
UPLOAD_RESPONSE=$(curl -s -X PUT \
  "https://api.volt.build/v2/apps/${VOLT_APP_ID}" \
  -H "Content-Type: application/zip" \
  -u "${VOLT_USER}:${VOLT_PASSWORD}" \
  --data-binary @gabai-v61-sms.zip)

echo "Upload response: ${UPLOAD_RESPONSE:0:100}..."

# 3. Build the APK
echo "🔨 Starting build..."
BUILD_RESPONSE=$(curl -s -X POST \
  "https://api.volt.build/v2/apps/${VOLT_APP_ID}/build" \
  -H "Content-Type: application/json" \
  -u "${VOLT_USER}:${VOLT_PASSWORD}" \
  -d '{"platform":"android","channel":"production","autoDebug":true}')

echo "Build response: ${BUILD_RESPONSE:0:100}..."

# 4. Poll for completion
echo "⏳ Waiting for build to complete (this takes 2-3 minutes)..."
for i in {1..60}; do
  sleep 5
  STATUS_RESPONSE=$(curl -s -X GET \
    "https://api.volt.build/v2/apps/${VOLT_APP_ID}" \
    -u "${VOLT_USER}:${VOLT_PASSWORD}")
  
  BUILD_STATUS=$(echo $STATUS_RESPONSE | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    status = data.get('data', {}).get('attributes', {}).get('buildStatus', {}).get('android', 'unknown')
    print(status)
except: print('parsing_error')
" 2>/dev/null || echo "parse_failed")
  
  echo -n "  Status: ${BUILD_STATUS} ($i/60)"
  echo ""
  
  if [[ "$BUILD_STATUS" == "complete" ]]; then
    echo "✅ Build completed!"
    break
  elif [[ "$BUILD_STATUS" == "error" || "$BUILD_STATUS" == "failed" ]]; then
    echo "❌ Build failed!"
    echo "Full response: $STATUS_RESPONSE"
    exit 1
  fi
done

# 5. Download the APK
echo "📥 Downloading APK..."
curl -s -X GET \
  "https://api.volt.build/v2/apps/${VOLT_APP_ID}/download/production/android" \
  -u "${VOLT_USER}:${VOLT_PASSWORD}" \
  -o gabai-v61-sms.apk

if [ -f gabai-v61-sms.apk ]; then
  echo "✅ APK downloaded: gabai-v61-sms.apk"
  ls -lh gabai-v61-sms.apk
  echo ""
  echo "🎉 Success! APK v61 ready with SMS verification fixes:"
  echo "  - API calls properly routed to https://gabai.ai"
  echo "  - SMS verification endpoints correctly handled"
  echo "  - Bearer token authentication for APK environment"
  echo ""
  echo "📱 Install: adb install gabai-v61-sms.apk"
  echo "📁 Location: $(pwd)/gabai-v61-sms.apk"
else
  echo "❌ Failed to download APK"
  exit 1
fi