#!/bin/bash

echo "🚀 Building GabAI APK v55 with VoltBuilder Fixes"
echo "================================================"
echo "Features:"
echo "  ✅ SDK 35 compatibility"
echo "  ✅ Hash routing fix for SMS verification"
echo "  ✅ Camera integration in chat"
echo "  ✅ AI vision for item identification"
echo "  ✅ Microphone permission handling"
echo "  ✅ VCF file support"
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

# Create config.xml with SDK 35 and all fixes
echo "6. Creating config.xml with SDK 35..."
cat > voltbuilder-v55/config.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<widget id="com.gabai.app" version="1.0.55" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
  <name>GabAI</name>
  <description>Your AI Personal Assistant</description>
  <author email="support@gabai.ai" href="https://gabai.ai">GabAI Team</author>
  
  <content src="index.html" />
  
  <platform name="android">
    <!-- SDK 35 Configuration -->
    <preference name="android-minSdkVersion" value="24" />
    <preference name="android-targetSdkVersion" value="35" />
    <preference name="android-compileSdkVersion" value="35" />
    
    <!-- Kotlin Version -->
    <preference name="GradlePluginKotlinVersion" value="1.9.24" />
    
    <!-- AndroidX Version Pins -->
    <preference name="AndroidXCoreVersion" value="1.13.0" />
    <preference name="AndroidXWebKitVersion" value="1.10.0" />
    <preference name="AndroidXAppCompatVersion" value="1.6.1" />
    
    <!-- Permissions (NO CONTACTS) -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Allow cleartext traffic for development -->
    <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application">
      <application android:usesCleartextTraffic="true" />
    </edit-config>
  </platform>
  
  <!-- Core Plugins (NO CONTACTS PLUGIN) -->
  <plugin name="cordova-plugin-camera" source="npm" />
  <plugin name="cordova-plugin-media-capture" source="npm" />
  <plugin name="cordova-plugin-media" source="npm" />
  <plugin name="cordova-plugin-file" source="npm" />
  <plugin name="cordova-plugin-device" source="npm" />
  <plugin name="cordova-plugin-inappbrowser" source="npm" />
  <plugin name="cordova-plugin-file-opener2" source="npm" />
  
  <!-- Preferences -->
  <preference name="Orientation" value="portrait" />
  <preference name="DisallowOverscroll" value="true" />
  <preference name="BackgroundColor" value="#FF000000" />
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

# Create build-extras.gradle to force AndroidX versions
echo "7. Creating build-extras.gradle..."
cat > voltbuilder-v55/build-extras.gradle << 'EOF'
// Force specific AndroidX versions to avoid conflicts
allprojects {
  configurations.all {
    resolutionStrategy {
      force 'androidx.core:core:1.13.0'
      force 'androidx.appcompat:appcompat:1.6.1'
      force 'androidx.webkit:webkit:1.10.0'
    }
  }
}
EOF

# Create voltbuilder.json with explicit configuration
echo "8. Creating voltbuilder.json..."
cat > voltbuilder-v55/voltbuilder.json << 'EOF'
{
  "appId": "com.gabai.app",
  "verbose": true,
  "android": {
    "cordovaAndroidVersion": "14.0.1",
    "gradleVersion": "8.7.0",
    "compileSdkVersion": 35,
    "targetSdkVersion": 35
  }
}
EOF

# Create zip package
echo "9. Creating APK package..."
cd voltbuilder-v55
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="../gabai-v55-${TIMESTAMP}.zip"
zip -r "$PACKAGE_NAME" . -x "*.DS_Store" "*.git*" "node_modules/*" "*.log" "*.tmp"
cd ..

# Copy to dist/public (where server serves from)
echo "10. Copying to dist/public..."
cp "gabai-v55-${TIMESTAMP}.zip" dist/public/gabai-v55.zip

# Show results
if [ -f dist/public/gabai-v55.zip ]; then
    PACKAGE_SIZE=$(du -h dist/public/gabai-v55.zip | cut -f1)
    echo ""
    echo "✅ APK Package Created Successfully!"
    echo "================================================"
    echo "📦 Package: gabai-v55.zip"
    echo "📏 Size: $PACKAGE_SIZE"
    echo ""
    echo "🔗 Download URL: https://gabai.ai/gabai-v55.zip"
    echo ""
    echo "📱 Upload to VoltBuilder: https://build.voltbuilder.com/"
    echo ""
    echo "Key Fixes Applied:"
    echo "  ✅ SDK versions set to 35"
    echo "  ✅ Kotlin version 1.9.24"
    echo "  ✅ AndroidX versions pinned"
    echo "  ✅ build-extras.gradle added"
    echo "  ✅ voltbuilder.json configured"
    echo "  ✅ Contacts plugin removed"
    echo "  ✅ BackgroundColor format fixed"
    echo "  ✅ file-opener2 plugin added for VCF"
    echo "================================================"
else
    echo "❌ Failed to create package!"
    exit 1
fi