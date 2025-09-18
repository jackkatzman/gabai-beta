#!/bin/bash

echo "🚀 Building GabAI APK v56 - Voice & SMS Fixed"
echo "=============================================="
echo "Features:"
echo "  ✅ Voice transcription fixed (ArrayBuffer transmission)"
echo "  ✅ SMS verification with production URLs"
echo "  ✅ APK detection flag (window.IS_VOLTBUILDER_APK)"
echo "  ✅ Compatible plugin versions (no version conflicts)"
echo "  ✅ SDK 35 compatibility"
echo "  ✅ Camera & mic permissions"
echo ""

# Build the frontend
echo "1. Building frontend with Vite..."
npm run build

# Create v56 directory structure
echo "2. Creating voltbuilder-v56 directory..."
rm -rf voltbuilder-v56
mkdir -p voltbuilder-v56/www

# Copy built files
echo "3. Copying built files to www..."
cp -r dist/public/* voltbuilder-v56/www/

# Fix asset paths for APK
echo "4. Fixing asset paths for file:// protocol..."
cd voltbuilder-v56/www
sed -i 's|href="/assets/|href="assets/|g' index.html
sed -i 's|src="/assets/|src="assets/|g' index.html
sed -i 's|href="/|href="./|g' index.html

# Add cordova.js script tag AND APK flag
echo "5. Adding cordova.js and APK detection flag..."
sed -i 's|</head>|  <script>window.IS_VOLTBUILDER_APK = true;</script>\n  <script src="cordova.js"></script>\n</head>|' index.html

cd ../..

# Create config.xml with NO VERSION SPECS to avoid conflicts
echo "6. Creating config.xml (compatible plugin versions)..."
cat > voltbuilder-v56/config.xml << 'CONFIG_EOF'
<?xml version="1.0" encoding="UTF-8"?>
<widget id="ai.gabai.app" version="1.0.56" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
  <name>GabAi</name>
  <description>Your AI Personal Assistant with Voice & SMS</description>
  <author email="support@gabai.ai" href="https://gabai.ai">GabAi Team</author>
  
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
    
    <!-- Permissions -->
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
  
  <!-- Core Plugins (NO VERSION SPECS - let VoltBuilder choose compatible versions) -->
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
CONFIG_EOF

# Create build-extras.gradle to force AndroidX versions
echo "7. Creating build-extras.gradle..."
cat > voltbuilder-v56/build-extras.gradle << 'GRADLE_EOF'
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
GRADLE_EOF

# Create voltbuilder.json with explicit configuration
echo "8. Creating voltbuilder.json..."
cat > voltbuilder-v56/voltbuilder.json << 'VOLT_EOF'
{
  "appId": "ai.gabai.app",
  "verbose": true,
  "android": {
    "cordovaAndroidVersion": "14.0.1",
    "gradleVersion": "8.7.0",
    "compileSdkVersion": 35,
    "targetSdkVersion": 35
  }
}
VOLT_EOF

# Create zip package
echo "9. Creating APK package..."
cd voltbuilder-v56
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="../gabai-v56-voice-sms-fixed-${TIMESTAMP}.zip"
zip -r "$PACKAGE_NAME" . -x "*.DS_Store" "*.git*" "node_modules/*" "*.log" "*.tmp"
cd ..

# Copy to current directory with simple name
echo "10. Copying to simple filename..."
cp "gabai-v56-voice-sms-fixed-${TIMESTAMP}.zip" gabai-v56-voice-sms-fixed.zip

# Show results
if [ -f gabai-v56-voice-sms-fixed.zip ]; then
    PACKAGE_SIZE=$(du -h gabai-v56-voice-sms-fixed.zip | cut -f1)
    echo ""
    echo "✅ APK Package Created Successfully!"
    echo "=============================================="
    echo "📦 Package: gabai-v56-voice-sms-fixed.zip"
    echo "📏 Size: $PACKAGE_SIZE"
    echo ""
    echo "🔧 Key Fixes Applied:"
    echo "  ✅ NO plugin version specs (avoids conflicts)"
    echo "  ✅ Voice transcription fixed (raw ArrayBuffer)"
    echo "  ✅ SMS endpoints use production URLs in APK"
    echo "  ✅ window.IS_VOLTBUILDER_APK flag set"
    echo "  ✅ SDK 35, Kotlin 1.9.24, AndroidX pinned"
    echo "  ✅ All permissions for mic/camera/files"
    echo ""
    echo "📱 Upload to VoltBuilder: https://build.voltbuilder.com/"
    echo "=============================================="
else
    echo "❌ Failed to create package!"
    exit 1
fi
