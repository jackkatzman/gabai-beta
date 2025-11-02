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
