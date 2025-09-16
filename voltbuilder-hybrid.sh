#!/bin/bash

echo "📦 Creating hybrid VoltBuilder package..."

# Clean up
rm -rf voltbuilder-hybrid
mkdir voltbuilder-hybrid

# Copy built files
cp -r dist/public/* voltbuilder-hybrid/

# Fix the index.html
cd voltbuilder-hybrid

# Make paths relative
sed -i 's|href="/|href="|g; s|src="/|src="|g' index.html
sed -i '/manifest.json/d; /vite.svg/d' index.html

# Add VoltBuilder redirect script ONLY (simple approach)
sed -i '/<\/head>/i \
<script>\
  // Simple VoltBuilder API redirect\
  if (window.location.hostname === "localhost" || window.location.protocol === "file:") {\
    console.log("VoltBuilder APK detected");\
    window.VOLTBUILDER_API = "https://gabai.ai";\
  }\
</script>' index.html

# Create config.xml
cat > config.xml << 'EOF'
<?xml version='1.0' encoding='utf-8'?>
<widget id="ai.gabai.app" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:android="http://schemas.android.com/apk/res/android">
    <name>GabAi</name>
    <description>Your Personal AI Assistant</description>
    <author email="support@gabai.ai" href="https://gabai.ai">
        GabAi Team
    </author>
    <content src="index.html" />
    
    <!-- Navigation -->
    <allow-navigation href="*" />
    <allow-intent href="*" />
    <access origin="*" />
    
    <!-- Preferences -->
    <preference name="android-minSdkVersion" value="22" />
    <preference name="android-targetSdkVersion" value="35" />
    
    <!-- VoltBuilder specific -->
    <plugin name="cordova-plugin-inappbrowser" />
    
    <!-- Platform specific config -->
    <platform name="android">
        <!-- Permissions -->
        <config-file parent="/*" target="AndroidManifest.xml">
            <uses-permission android:name="android.permission.INTERNET" />
            <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
            <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
            <uses-permission android:name="android.permission.RECORD_AUDIO" />
            <uses-permission android:name="android.permission.READ_CALENDAR" />
            <uses-permission android:name="android.permission.WRITE_CALENDAR" />
            <uses-permission android:name="android.permission.CAMERA" />
        </config-file>
    </platform>
</widget>
EOF

# Create voltbuilder.json for redirect approach
cat > voltbuilder.json << 'EOF'
{
  "redirects": [
    {
      "from": "/api/*",
      "to": "https://gabai.ai/api/:splat"
    }
  ]
}
EOF

# Create the zip
zip -r ../gabai-hybrid.zip .
cd ..

echo "✅ Hybrid package created: gabai-hybrid.zip"
echo ""
echo "This package:"
echo "  - Uses VoltBuilder redirects config"
echo "  - Minimal changes to code"
echo "  - Should redirect /api/* to gabai.ai"
echo ""
ls -lh gabai-hybrid.zip