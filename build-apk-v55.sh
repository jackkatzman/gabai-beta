#!/bin/bash

echo "🚀 Building GabAI APK v55 with Latest Updates"
echo "================================================"
echo "Features:"
echo "  ✅ Hash routing fix for SMS verification"
echo "  ✅ Camera integration in chat"
echo "  ✅ AI vision for item identification"
echo "  ✅ Microphone permission handling"
echo ""

# Build the frontend
echo "1. Building frontend with Vite..."
npx vite build

# Create v55 directory structure
echo "2. Creating voltbuilder-v55 directory..."
rm -rf voltbuilder-v55
mkdir -p voltbuilder-v55/www

# Copy built files
echo "3. Copying built files to www..."
cp -r dist/public/* voltbuilder-v55/www/

# Fix asset paths for APK
echo "4. Fixing asset paths for file:// protocol..."
cd voltbuilder-v55/www
sed -i 's|href="/assets/|href="assets/|g' index.html
sed -i 's|src="/assets/|src="assets/|g' index.html
sed -i 's|href="/|href="./|g' index.html

# Add cordova.js script tag
echo "5. Adding cordova.js script..."
sed -i 's|</head>|  <script src="cordova.js"></script>\n</head>|' index.html

cd ../..

# Create config.xml
echo "6. Creating config.xml..."
cat > voltbuilder-v55/config.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<widget id="com.gabai.app" version="1.0.55" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
  <name>GabAI</name>
  <description>Your AI Personal Assistant</description>
  <author email="support@gabai.ai" href="https://gabai.ai">GabAI Team</author>
  
  <content src="index.html" />
  
  <platform name="android">
    <preference name="android-minSdkVersion" value="24" />
    <preference name="android-targetSdkVersion" value="33" />
    
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.WRITE_CONTACTS" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Allow cleartext traffic for development -->
    <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application">
      <application android:usesCleartextTraffic="true" />
    </edit-config>
  </platform>
  
  <!-- Core Plugins -->
  <plugin name="cordova-plugin-camera" source="npm" />
  <plugin name="cordova-plugin-media-capture" source="npm" />
  <plugin name="cordova-plugin-media" source="npm" />
  <plugin name="cordova-plugin-contacts" source="npm" />
  <plugin name="cordova-plugin-file" source="npm" />
  <plugin name="cordova-plugin-device" source="npm" />
  <plugin name="cordova-plugin-inappbrowser" source="npm" />
  
  <!-- Preferences -->
  <preference name="Orientation" value="portrait" />
  <preference name="DisallowOverscroll" value="true" />
  <preference name="BackgroundColor" value="0xff000000" />
  <preference name="SplashScreenDelay" value="3000" />
  <preference name="ShowSplashScreenSpinner" value="false" />
  
  <!-- Access Control -->
  <access origin="*" />
  <allow-intent href="http://*/*" />
  <allow-intent href="https://*/*" />
  <allow-intent href="tel:*" />
  <allow-intent href="sms:*" />
  <allow-intent href="mailto:*" />
  <allow-navigation href="*" />
  
  <!-- CSP for security -->
  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: gap: content:; style-src * 'unsafe-inline'; script-src * 'unsafe-inline' 'unsafe-eval'; img-src * data: content: blob:; connect-src * blob:;" />
</widget>
EOF

# Create zip package
echo "7. Creating APK package..."
cd voltbuilder-v55
PACKAGE_NAME="../gabai-v55-$(date +%Y%m%d-%H%M%S).zip"
zip -r "$PACKAGE_NAME" . -x "*.DS_Store" "*.git*" "node_modules/*" "*.log" "*.tmp"
cd ..

# Copy to public
cp gabai-v55*.zip server/public/gabai-v55.zip

# Show results
if [ -f server/public/gabai-v55.zip ]; then
    PACKAGE_SIZE=$(du -h server/public/gabai-v55.zip | cut -f1)
    echo ""
    echo "✅ APK Package Created Successfully!"
    echo "================================================"
    echo "📦 Package: gabai-v55.zip"
    echo "📏 Size: $PACKAGE_SIZE"
    echo ""
    echo "🔗 Download URL: https://gabai.ai/gabai-v55.zip"
    echo ""
    echo "📱 Upload to VoltBuilder: https://build.voltbuilder.com/"
    echo "================================================"
else
    echo "❌ Failed to create package!"
    exit 1
fi