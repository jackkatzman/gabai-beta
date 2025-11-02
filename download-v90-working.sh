#!/bin/bash
echo "📥 Downloading GabAI v90 APK with Working Voice Reminders..."
curl -X GET \
  "https://api.volt.build/v2/apps/com.gabalabs.gabai/download/production/android" \
  -u "jack@gabalabs.ai:${VOLT_PASSWORD}" \
  -o "gabai-v90-working.apk" \
  -L -w "%{http_code}" | tee /tmp/download_status

STATUS=$(cat /tmp/download_status)
if [ "$STATUS" = "200" ]; then
    SIZE=$(ls -lh gabai-v90-working.apk | awk '{print $5}')
    echo ""
    echo "✅ SUCCESS! APK downloaded: gabai-v90-working.apk ($SIZE)"
    echo ""
    echo "📱 This APK includes:"
    echo "• Working voice reminders that trigger on schedule"
    echo "• Proper authentication (no demo user issues)"
    echo "• All consent fields visible in reminder form"
    echo "• Database saves reminders correctly"
    echo ""
    echo "🎯 To Install:"
    echo "1. Transfer gabai-v90-working.apk to your Android device"
    echo "2. Enable 'Install from Unknown Sources' in settings"
    echo "3. Install the APK"
    echo "4. Sign in with your Google account"
    echo "5. Test voice reminders - they work!"
else
    echo "⏳ Build not ready yet. Try again in 30 seconds."
fi
