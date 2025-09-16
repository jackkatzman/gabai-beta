#!/bin/bash

echo "📦 Creating direct VoltBuilder package with inline fetch redirect..."

# Clean up
rm -rf voltbuilder-direct
mkdir voltbuilder-direct

# Copy built files
cp -r dist/public/* voltbuilder-direct/

# Fix the index.html
cd voltbuilder-direct

# Make paths relative
sed -i 's|href="/|href="|g; s|src="/|src="|g' index.html
sed -i '/manifest.json/d; /vite.svg/d' index.html

# Add DIRECT fetch interceptor in index.html before any scripts load
sed -i '/<script type="module"/i \
<script>\
  // Direct API redirect for VoltBuilder APK\
  if (window.location.protocol === "file:" || (navigator.userAgent.includes("wv") && navigator.userAgent.includes("Android"))) {\
    console.log("APK detected - redirecting API calls to gabai.ai");\
    const originalFetch = window.fetch;\
    window.fetch = function(url, options) {\
      let finalUrl = url;\
      if (typeof url === "string") {\
        if (url.startsWith("/api/")) {\
          finalUrl = "https://gabai.ai" + url;\
          console.log("Redirecting:", url, "->", finalUrl);\
        } else if (!url.startsWith("http")) {\
          // Handle relative URLs\
          finalUrl = "https://gabai.ai/" + url;\
        }\
      }\
      return originalFetch.call(this, finalUrl, options || {});\
    };\
  }\
</script>' index.html

# Create config.xml with all permissions
cat > config.xml << 'EOF'
<?xml version='1.0' encoding='utf-8'?>
<widget id="ai.gabai.app" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:android="http://schemas.android.com/apk/res/android">
    <name>GabAi</name>
    <description>Your Personal AI Assistant</description>
    <author email="support@gabai.ai" href="https://gabai.ai">
        GabAi Team
    </author>
    <content src="index.html" />
    
    <!-- Full access -->
    <allow-navigation href="*" />
    <allow-intent href="*" />
    <access origin="*" />
    
    <!-- Preferences -->
    <preference name="android-minSdkVersion" value="22" />
    <preference name="android-targetSdkVersion" value="35" />
    
    <!-- Platform specific config -->
    <platform name="android">
        <!-- All permissions -->
        <config-file parent="/*" target="AndroidManifest.xml">
            <uses-permission android:name="android.permission.INTERNET" />
            <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
            <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
            <uses-permission android:name="android.permission.RECORD_AUDIO" />
            <uses-permission android:name="android.permission.READ_CALENDAR" />
            <uses-permission android:name="android.permission.WRITE_CALENDAR" />
            <uses-permission android:name="android.permission.CAMERA" />
            <uses-permission android:name="android.permission.READ_CONTACTS" />
            <uses-permission android:name="android.permission.WRITE_CONTACTS" />
            <uses-permission android:name="android.permission.VIBRATE" />
            <uses-permission android:name="android.permission.WAKE_LOCK" />
        </config-file>
    </platform>
</widget>
EOF

# Create the zip
zip -r ../gabai-direct.zip .
cd ..

echo "✅ Direct package created: gabai-direct.zip"
echo ""
echo "This package:"
echo "  - Intercepts ALL /api/* calls directly"
echo "  - Redirects them to https://gabai.ai"
echo "  - Works before any app code loads"
echo ""
ls -lh gabai-direct.zip