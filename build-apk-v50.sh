#!/bin/bash

echo "==================================="
echo "Building GabAi APK v50"
echo "Voice & SMS Verification Fix"
echo "==================================="

# Build frontend
echo "📦 Building frontend..."
npm run build

# Prepare the www directory
echo "📱 Preparing www directory..."
rm -rf www
cp -r dist/public www

# Fix asset paths for APK
echo "🔧 Fixing asset paths for APK..."
sed -i 's|="/assets/|="assets/|g' www/index.html
sed -i 's|="/|="|g' www/index.html

# Remove vite.svg and favicon.ico references
echo "🔧 Removing development asset references..."
sed -i 's|<link rel="icon" type="image/svg+xml" href="[^"]*">||g' www/index.html
sed -i 's|<link rel="shortcut icon" href="[^"]*">||g' www/index.html

# Add inline favicon to prevent 404
echo "🔧 Adding inline favicon to prevent 404..."
sed -i 's|</head>|    <link rel="shortcut icon" href="data:,">\n</head>|' www/index.html

# Add cordova.js script tag AND APK flag
echo "🔧 Adding cordova.js and APK flag to index.html..."
sed -i 's|</body>|    <script>window.IS_VOLTBUILDER_APK = true;</script>\n    <script src="cordova.js"></script>\n</body>|' www/index.html

# Create config.xml with permissions for mic, camera, contacts
echo "📝 Creating config.xml for v50..."
cat > config.xml << 'CONFIG_EOF'
<?xml version="1.0" encoding="UTF-8"?>
<widget id="ai.gabai.app" version="1.0.50" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <name>GabAi</name>
    <description>Your AI personal assistant with voice, camera, and SMS reminders</description>
    <author email="support@gabai.ai" href="https://gabai.ai">GabAi Team</author>
    <content src="index.html" />
    
    <!-- Allow navigation to gabai.ai for API calls -->
    <allow-navigation href="https://gabai.ai/*" />
    <allow-navigation href="http://localhost/*" />
    <allow-navigation href="file://*" />
    
    <!-- Allow all external resources -->
    <access origin="*" />
    
    <!-- Android specific -->
    <platform name="android">
        <preference name="android-minSdkVersion" value="24" />
        <preference name="android-targetSdkVersion" value="35" />
        
        <!-- Allow cleartext traffic for localhost -->
        <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application">
            <application android:usesCleartextTraffic="true" />
        </edit-config>
        
        <!-- Permissions for mic, camera, contacts -->
        <config-file parent="/manifest" target="AndroidManifest.xml">
            <uses-permission android:name="android.permission.RECORD_AUDIO" />
            <uses-permission android:name="android.permission.CAMERA" />
            <uses-permission android:name="android.permission.READ_CONTACTS" />
            <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
            <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
            <uses-permission android:name="android.permission.INTERNET" />
        </config-file>
    </platform>
    
    <!-- Preferences with corrected color format -->
    <preference name="DisallowOverscroll" value="true" />
    <preference name="Orientation" value="default" />
    <preference name="BackgroundColor" value="#FFFFFFFF" />
    
    <!-- Plugins for mic, camera, contacts -->
    <plugin name="cordova-plugin-media" spec="^6.1.0" />
    <plugin name="cordova-plugin-media-capture" spec="^5.0.0" />
    <plugin name="cordova-plugin-camera" spec="^7.0.0" />
    <plugin name="cordova-plugin-contacts" spec="^3.0.1" />
    <plugin name="cordova-plugin-file" spec="^8.0.0" />
    <plugin name="cordova-plugin-device" spec="^3.0.0" />
    
    <!-- Engine requirements -->
    <engine name="android" spec="^14.0.0" />
</widget>
CONFIG_EOF

# Create package.json with plugins
echo "📋 Creating package.json for VoltBuilder..."
cat > voltbuilder-package.json << 'PACKAGE_EOF'
{
  "name": "gabai",
  "version": "1.0.50",
  "description": "GabAi - Your AI Personal Assistant",
  "scripts": {
    "build": "echo 'Already built'"
  },
  "dependencies": {
    "cordova-android": "^14.0.0",
    "cordova-plugin-media": "^6.1.0",
    "cordova-plugin-media-capture": "^5.0.0",
    "cordova-plugin-camera": "^7.0.0",
    "cordova-plugin-contacts": "^3.0.1",
    "cordova-plugin-file": "^8.0.0",
    "cordova-plugin-device": "^3.0.0"
  }
}
PACKAGE_EOF

# Clean up any old zip files in www
echo "🧹 Cleaning up old files..."
rm -f www/*.zip

# Create the zip file for VoltBuilder
echo "📦 Creating VoltBuilder package..."
zip -r gabai-apk-v50-voice-sms-fix.zip www config.xml voltbuilder-package.json

echo "✅ Build complete!"
echo ""
echo "📱 APK v50 - Voice & SMS Fixes:"
echo "  ✅ Voice transcription fixed (raw ArrayBuffer transmission)"
echo "  ✅ SMS verification endpoints configured for production"
echo "  ✅ APK detection with window.IS_VOLTBUILDER_APK flag"
echo "  ✅ Mic, Camera, Contacts permissions included"
echo "  ✅ CORS headers properly configured"
echo ""
echo "📦 Output file: gabai-apk-v50-voice-sms-fix.zip"
echo ""
echo "🚀 Next steps:"
echo "  1. Download: gabai-apk-v50-voice-sms-fix.zip"
echo "  2. Upload to VoltBuilder.com"
echo "  3. Build APK with VoltBuilder"
echo "  4. Install the new APK on your device"
echo ""
echo "Version: 1.0.50"
echo "Build date: $(date)"
