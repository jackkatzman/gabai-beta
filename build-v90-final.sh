#!/bin/bash

# GabAI v90 FINAL Build - All Fixes Included
VOLT_USER="jack@gabalabs.ai"
VOLT_APP_ID="com.gabalabs.gabai"

echo "🚀 Building GabAI v90 FINAL APK"
echo "================================="
echo "✅ Includes ALL fixes:"
echo "  • Voice reminder consent checkbox visible"
echo "  • Phone number input field in main form"
echo "  • Voice/SMS toggle buttons accessible"
echo "  • API URLs pointing to https://gabai.ai"
echo "  • Mobile authentication (Demo User) enabled"
echo ""

# Upload the fixed package
echo "📦 Uploading gabai-v90-fixed.zip to VoltBuilder..."
UPLOAD_RESPONSE=$(curl -X POST \
  "https://api.volt.build/v2/apps/${VOLT_APP_ID}" \
  -F "file=@gabai-v90-fixed.zip" \
  -u "${VOLT_USER}:${VOLT_PASSWORD}" \
  -s -w "\nSTATUS:%{http_code}")

STATUS_CODE=$(echo "$UPLOAD_RESPONSE" | grep "STATUS:" | cut -d: -f2)

if [ "$STATUS_CODE" != "200" ] && [ "$STATUS_CODE" != "201" ]; then
    echo "⚠️ Upload status: $STATUS_CODE"
else
    echo "✅ Package uploaded successfully"
fi

# Start the build
echo "🔨 Starting build process..."
BUILD_RESPONSE=$(curl -X POST \
  "https://api.volt.build/v2/apps/${VOLT_APP_ID}/build" \
  -d "platform=android" \
  -u "${VOLT_USER}:${VOLT_PASSWORD}" \
  -s)

echo "✅ Build initiated"
echo ""
echo "📱 Build is processing on VoltBuilder..."
echo ""

# Create a download script for when it's ready
cat > download-v90-apk.sh << 'EOF'
#!/bin/bash
echo "📥 Attempting to download GabAI v90 APK..."
curl -X GET \
  "https://api.volt.build/v2/apps/com.gabalabs.gabai/download/production/android" \
  -u "jack@gabalabs.ai:${VOLT_PASSWORD}" \
  -o "gabai-v90-final.apk" \
  -L -w "%{http_code}" | tee /tmp/download_status

STATUS=$(cat /tmp/download_status)
if [ "$STATUS" = "200" ]; then
    SIZE=$(ls -lh gabai-v90-final.apk | awk '{print $5}')
    echo ""
    echo "✅ SUCCESS! APK downloaded: gabai-v90-final.apk ($SIZE)"
    echo ""
    echo "📱 Installation Instructions:"
    echo "1. Transfer gabai-v90-final.apk to your Android phone"
    echo "2. Enable 'Install from Unknown Sources'"
    echo "3. Install the APK"
    echo ""
    echo "🎯 Test these features:"
    echo "• Open app - should auto-login as Demo User (no SMS needed)"
    echo "• Go to Reminders - all fields should be visible"
    echo "• Create a voice reminder - consent checkbox is there!"
else
    echo "⏳ Build not ready yet. Try again in 30 seconds."
fi
EOF

chmod +x download-v90-apk.sh

echo "⏰ VoltBuilder typically takes 2-5 minutes to build"
echo ""
echo "📥 To download your APK when ready, run:"
echo "   ./download-v90-apk.sh"
echo ""
echo "You can run this command every 30 seconds until the build completes."