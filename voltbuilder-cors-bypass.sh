#!/bin/bash

echo "📦 Creating VoltBuilder package with CORS bypass..."

# Clean up
rm -rf voltbuilder-cors-bypass
mkdir voltbuilder-cors-bypass

# Copy built files
cp -r dist/public/* voltbuilder-cors-bypass/

# Fix the index.html
cd voltbuilder-cors-bypass

# Make paths relative
sed -i 's|href="/|href="|g; s|src="/|src="|g' index.html
sed -i '/manifest.json/d; /vite.svg/d' index.html

# Add CORS bypass fetch interceptor
sed -i '/<script type="module"/i \
<script>\
  // CORS Bypass for VoltBuilder APK\
  if (window.location.protocol === "file:" || (navigator.userAgent.includes("wv") && navigator.userAgent.includes("Android"))) {\
    console.log("APK detected - bypassing CORS for gabai.ai");\
    const originalFetch = window.fetch;\
    window.fetch = function(url, options = {}) {\
      let finalUrl = url;\
      let finalOptions = { ...options };\
      \
      if (typeof url === "string") {\
        if (url.startsWith("/api/")) {\
          finalUrl = "https://gabai.ai" + url;\
          console.log("Redirecting:", url, "->", finalUrl);\
          // Remove credentials to bypass CORS\
          finalOptions.credentials = "omit";\
          // Remove certain headers that trigger CORS\
          if (finalOptions.headers) {\
            const headers = new Headers(finalOptions.headers);\
            headers.delete("Cookie");\
            finalOptions.headers = headers;\
          }\
        } else if (!url.startsWith("http")) {\
          finalUrl = "https://gabai.ai/" + url;\
        }\
      }\
      \
      // Try fetch with CORS bypass\
      return originalFetch.call(this, finalUrl, finalOptions)\
        .catch(err => {\
          console.error("Fetch failed, trying with mode: no-cors", err);\
          // If CORS fails, try no-cors mode (limited but may work)\
          finalOptions.mode = "no-cors";\
          return originalFetch.call(this, finalUrl, finalOptions);\
        });\
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
    <preference name="AllowInlineMediaPlayback" value="true" />
    <preference name="DisallowOverscroll" value="false" />
    
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
        
        <!-- Allow cleartext traffic for localhost -->
        <edit-config file="AndroidManifest.xml" mode="merge" target="/manifest/application">
            <application android:usesCleartextTraffic="true" />
        </edit-config>
    </platform>
</widget>
EOF

# Create the zip
zip -r ../gabai-cors-bypass.zip .
cd ..

echo "✅ CORS bypass package created: gabai-cors-bypass.zip"
echo ""
echo "This package:"
echo "  - Bypasses CORS by removing credentials"
echo "  - Falls back to no-cors mode if needed"
echo "  - Allows cleartext traffic"
echo ""
ls -lh gabai-cors-bypass.zip