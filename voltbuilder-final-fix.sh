#!/bin/bash

echo "📦 Creating final VoltBuilder package with routing fix..."

# Clean up
rm -rf voltbuilder-final
mkdir voltbuilder-final

# Copy built files
cp -r dist/public/* voltbuilder-final/

# Fix the index.html
cd voltbuilder-final

# Make paths relative
sed -i 's|href="/|href="|g; s|src="/|src="|g' index.html
sed -i '/manifest.json/d; /vite.svg/d' index.html

# Add comprehensive fixes: routing, CORS, Cordova guard, and API redirect
sed -i '/<script type="module"/i \
<script>\
  // Fix routing for APK - redirect /index.html to /\
  if (window.location.pathname === "/index.html") {\
    console.log("Fixing APK route from /index.html to /");\
    window.history.replaceState({}, "", "/");\
  }\
  \
  // Guard Cordova script loading\
  (function () {\
    var isCordova = !!window.cordova || /(cordova|android|iphone|ipod|ipad)/i.test(navigator.userAgent);\
    if (isCordova && typeof document !== "undefined") {\
      var s = document.createElement("script");\
      s.src = "cordova.js";\
      s.onerror = function() { console.log("Cordova.js not found - running as web app"); };\
      document.head.appendChild(s);\
    }\
  })();\
  \
  // API redirect for VoltBuilder APK\
  if (window.location.protocol === "file:" || window.location.hostname === "localhost" || (navigator.userAgent.includes("wv") && navigator.userAgent.includes("Android"))) {\
    console.log("APK detected - configuring API redirect to gabai.ai");\
    const originalFetch = window.fetch;\
    window.fetch = function(url, options = {}) {\
      let finalUrl = url;\
      let finalOptions = { ...options };\
      \
      if (typeof url === "string") {\
        if (url.startsWith("/api/")) {\
          finalUrl = "https://gabai.ai" + url;\
          console.log("API redirect:", url, "->", finalUrl);\
          // Ensure credentials are included for auth\
          if (!finalOptions.credentials) {\
            finalOptions.credentials = "include";\
          }\
        } else if (!url.startsWith("http") && !url.includes("assets")) {\
          // Handle other relative URLs except assets\
          if (url !== "/" && !url.startsWith("/#")) {\
            finalUrl = "https://gabai.ai/" + url;\
          }\
        }\
      }\
      \
      return originalFetch.call(this, finalUrl, finalOptions);\
    };\
  }\
</script>' index.html

# Create config.xml with all permissions and plugins
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
    
    <!-- Plugins for full functionality -->
    <plugin name="cordova-plugin-inappbrowser" />
    <plugin name="cordova-plugin-file" />
    <plugin name="cordova-plugin-file-opener2" />
    
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
            <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
            <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
        </config-file>
        
        <!-- Allow cleartext traffic for localhost -->
        <edit-config file="AndroidManifest.xml" mode="merge" target="/manifest/application">
            <application android:usesCleartextTraffic="true" />
        </edit-config>
    </platform>
</widget>
EOF

# Create the zip
zip -r ../gabai-final-fix.zip .
cd ..

echo "✅ Final package created: gabai-final-fix.zip"
echo ""
echo "This package fixes:"
echo "  - Routing: Redirects /index.html to / for React Router"
echo "  - API calls: Redirects to gabai.ai with credentials"
echo "  - Cordova: Guards script loading"
echo "  - Permissions: All Android permissions included"
echo ""
ls -lh gabai-final-fix.zip