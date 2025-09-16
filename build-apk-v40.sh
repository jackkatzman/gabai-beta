#!/bin/bash

echo "==================================="
echo "Building GabAi APK v40"
echo "SDK 35 Compatible Build"
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

# Add cordova.js script tag
echo "🔧 Adding cordova.js to index.html..."
sed -i 's|</body>|    <script src="cordova.js"></script>\n</body>|' www/index.html

# Create config.xml for VoltBuilder with SDK 35 compatibility
echo "📝 Creating config.xml for v40 (SDK 35 compatible)..."
cat > config.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<widget id="ai.gabai.app" version="1.0.40" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <name>GabAi</name>
    <description>Your AI personal assistant with voice and SMS reminders</description>
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
        <preference name="android-compileSdkVersion" value="35" />
        
        <!-- Permissions -->
        <config-file parent="/*" target="AndroidManifest.xml">
            <uses-permission android:name="android.permission.INTERNET" />
            <uses-permission android:name="android.permission.CAMERA" />
            <uses-permission android:name="android.permission.RECORD_AUDIO" />
            <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
            <uses-permission android:name="android.permission.READ_CONTACTS" />
            <uses-permission android:name="android.permission.WRITE_CONTACTS" />
            <uses-permission android:name="android.permission.READ_CALENDAR" />
            <uses-permission android:name="android.permission.WRITE_CALENDAR" />
            <uses-permission android:name="android.permission.VIBRATE" />
            <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
            <uses-permission android:name="android.permission.WAKE_LOCK" />
            <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
        </config-file>
        
        <!-- Allow cleartext traffic for localhost -->
        <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application">
            <application android:usesCleartextTraffic="true" />
        </edit-config>
    </platform>
    
    <!-- iOS specific -->
    <platform name="ios">
        <preference name="deployment-target" value="13.0" />
        
        <!-- Permissions descriptions -->
        <config-file parent="NSCameraUsageDescription" target="*-Info.plist">
            <string>GabAi needs camera access to scan business cards and capture photos</string>
        </config-file>
        <config-file parent="NSMicrophoneUsageDescription" target="*-Info.plist">
            <string>GabAi needs microphone access for voice commands and audio messages</string>
        </config-file>
        <config-file parent="NSContactsUsageDescription" target="*-Info.plist">
            <string>GabAi needs contacts access to help manage your relationships</string>
        </config-file>
        <config-file parent="NSCalendarsUsageDescription" target="*-Info.plist">
            <string>GabAi needs calendar access to manage your events and reminders</string>
        </config-file>
        <config-file parent="NSPhotoLibraryUsageDescription" target="*-Info.plist">
            <string>GabAi needs photo library access to save and retrieve images</string>
        </config-file>
    </platform>
    
    <!-- Preferences -->
    <preference name="DisallowOverscroll" value="true" />
    <preference name="Orientation" value="default" />
    <preference name="BackgroundColor" value="0xFFFFFFFF" />
    <preference name="SplashScreen" value="none" />
    <preference name="StatusBarOverlaysWebView" value="false" />
    <preference name="StatusBarBackgroundColor" value="#000000" />
    <preference name="StatusBarStyle" value="lightcontent" />
    
    <!-- Required Cordova plugins with SDK 35 compatible versions -->
    <plugin name="cordova-plugin-device" spec="^3.0.0" />
    <plugin name="cordova-plugin-camera" spec="^8.0.0" />
    <plugin name="cordova-plugin-media-capture" spec="^6.0.0" />
    <plugin name="cordova-plugin-media" spec="^7.0.0" />
    <plugin name="cordova-plugin-file" spec="^8.1.2" />
    <plugin name="cordova-plugin-contacts-x" spec="^2.0.3" />
    <plugin name="cordova.plugins.diagnostic" spec="^7.2.4" />
    <plugin name="cordova-plugin-calendar" spec="^5.1.6" />
    <plugin name="cordova-plugin-local-notification" spec="^1.2.1" />
    <plugin name="cordova-plugin-vibration" spec="^3.1.1" />
    <plugin name="cordova-plugin-network-information" spec="^3.0.0" />
    <plugin name="cordova-plugin-statusbar" spec="^4.0.0" />
    
    <!-- Engine requirements -->
    <engine name="android" spec="^14.0.0" />
    <engine name="ios" spec="^7.1.0" />
</widget>
EOF

# Create package.json for VoltBuilder with explicit cordova-android version
echo "📋 Creating package.json for VoltBuilder..."
cat > voltbuilder-package.json << 'EOF'
{
  "name": "gabai",
  "version": "1.0.40",
  "description": "GabAi - Your AI Personal Assistant",
  "scripts": {
    "build": "echo 'Already built'"
  },
  "dependencies": {
    "cordova-android": "^14.0.0",
    "cordova-ios": "^7.1.0"
  },
  "cordova": {
    "platforms": [
      "android",
      "ios"
    ],
    "plugins": {
      "cordova-plugin-device": {},
      "cordova-plugin-camera": {},
      "cordova-plugin-media-capture": {},
      "cordova-plugin-media": {},
      "cordova-plugin-file": {},
      "cordova-plugin-contacts-x": {},
      "cordova.plugins.diagnostic": {},
      "cordova-plugin-calendar": {},
      "cordova-plugin-local-notification": {},
      "cordova-plugin-vibration": {},
      "cordova-plugin-network-information": {},
      "cordova-plugin-statusbar": {}
    }
  }
}
EOF

# Create a simple icon if it doesn't exist
echo "🎨 Creating GabAi icon..."
if [ ! -f "www/gabai-icon.png" ]; then
  # Create a simple 512x512 white icon with "G" text
  convert -size 512x512 xc:white \
    -gravity center -pointsize 300 -fill '#4A90E2' \
    -annotate +0+0 'G' \
    www/gabai-icon.png 2>/dev/null || echo "Warning: Could not create icon"
fi

# Create the zip file for VoltBuilder
echo "📦 Creating VoltBuilder package..."
zip -r gabai-apk-v40-sdk35-compatible.zip www config.xml voltbuilder-package.json

echo "✅ Build complete!"
echo ""
echo "📱 APK v40 Features:"
echo "  - Android SDK 35 full compatibility"
echo "  - Cordova Android 14.0.0+ support"
echo "  - Updated plugin versions for SDK 35"
echo "  - Added cordova.js to index.html"
echo "  - Removed deprecated plugins"
echo "  - POST_NOTIFICATIONS permission for Android 13+"
echo ""
echo "📦 Output file: gabai-apk-v40-sdk35-compatible.zip"
echo ""
echo "🚀 Next steps:"
echo "  1. Upload gabai-apk-v40-sdk35-compatible.zip to VoltBuilder"
echo "  2. Build APK with VoltBuilder"
echo "  3. Test on Android with SDK 35"
echo ""
echo "Version: 1.0.40"
echo "Build date: $(date)"