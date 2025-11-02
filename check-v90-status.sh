#!/bin/bash

echo "🔍 Checking GabAI v90 APK build status..."

STATUS=$(curl -X GET \
  "https://api.volt.build/v2/apps/com.gabalabs.gabai" \
  -u "jack@gabalabs.ai:${VOLT_PASSWORD}" \
  -s | grep -o '"build_status":"[^"]*' | cut -d'"' -f4)

echo "Build status: $STATUS"

if [ "$STATUS" = "complete" ]; then
    echo "✅ Build is complete! Downloading..."
    curl -X GET \
      "https://api.volt.build/v2/apps/com.gabalabs.gabai/download/production/android" \
      -u "jack@gabalabs.ai:${VOLT_PASSWORD}" \
      -o "gabai-v90.apk" \
      -L -s
    
    if [ -f "gabai-v90.apk" ]; then
        SIZE=$(ls -lh gabai-v90.apk | awk '{print $5}')
        echo "✅ Downloaded: gabai-v90.apk ($SIZE)"
        echo ""
        echo "📱 Your APK is ready with these fixes:"
        echo "  • Voice reminder consent checkbox visible"
        echo "  • Phone number input in main form"
        echo "  • Voice/SMS toggle buttons visible"
        echo "  • Clear consent error messages"
    else
        echo "⚠️ Download didn't complete. Try again in a moment."
    fi
elif [ "$STATUS" = "error" ]; then
    echo "❌ Build failed. Check VoltBuilder dashboard for details."
else
    echo "⏳ Build still in progress. Try again in 30 seconds..."
    echo "   Run: ./check-v90-status.sh"
fi