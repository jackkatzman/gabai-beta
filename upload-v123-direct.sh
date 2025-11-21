#!/bin/bash

echo "🚀 Uploading GabAI v123 to VoltBuilder (Direct Method)"
echo "===================================================="

if [ ! -f "gabai-v123.zip" ]; then
    echo "❌ Error: gabai-v123.zip not found"
    exit 1
fi

# Try using the credentials as basic auth directly (old API style)
VOLT_CREDS="${Voltbuiler}"

echo "📦 Attempting upload with basic auth..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://volt.build/api/build" \
  -u "${VOLT_CREDS}" \
  -F "file=@gabai-v123.zip" \
  -F "platform=android")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Response code: $HTTP_CODE"
echo "Response body: $BODY"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Upload successful!"
    exit 0
fi

# Try the web form submission endpoint
echo ""
echo "Trying web form submission..."
RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST \
  "https://volt.build/upload" \
  -u "${VOLT_CREDS}" \
  -F "project=@gabai-v123.zip" \
  -F "platform=android")

HTTP_CODE2=$(echo "$RESPONSE2" | tail -n 1)
BODY2=$(echo "$RESPONSE2" | head -n -1)

echo "Response code: $HTTP_CODE2"
echo "Response body: $BODY2"

if [ "$HTTP_CODE2" = "200" ] || [ "$HTTP_CODE2" = "201" ] || [ "$HTTP_CODE2" = "302" ]; then
    echo "✅ Upload successful via web form!"
    exit 0
fi

echo "❌ Both methods failed"
