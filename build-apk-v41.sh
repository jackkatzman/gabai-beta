#!/bin/bash

echo "==================================="
echo "Building GabAi APK v41"
echo "Clean SDK 35 Build - No Conflicts"
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

# Create config.xml for VoltBuilder - minimal plugin config to avoid conflicts
echo "📝 Creating config.xml for v41 (Clean SDK 35)..."
cat > config.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<widget id="ai.gabai.app" version="1.0.41" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
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
    
    <!-- Core plugins only - let Cordova handle version resolution -->
    <plugin name="cordova-plugin-device" />
    <plugin name="cordova-plugin-camera" />
    <plugin name="cordova-plugin-file" />
    <plugin name="cordova-plugin-statusbar" />
    
    <!-- Engine requirements -->
    <engine name="android" spec="^14.0.0" />
</widget>
EOF

# Create package.json for VoltBuilder - minimal to avoid conflicts
echo "📋 Creating package.json for VoltBuilder..."
cat > voltbuilder-package.json << 'EOF'
{
  "name": "gabai",
  "version": "1.0.41",
  "description": "GabAi - Your AI Personal Assistant",
  "scripts": {
    "build": "echo 'Already built'"
  },
  "dependencies": {
    "cordova-android": "^14.0.0"
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

# Clean up any old zip files in www
echo "🧹 Cleaning up old files..."
rm -f www/*.zip

# Create the zip file for VoltBuilder
echo "📦 Creating VoltBuilder package..."
zip -r gabai-apk-v41-clean-sdk35.zip www config.xml voltbuilder-package.json

echo "✅ Build complete!"
echo ""
echo "📱 APK v41 Features:"
echo "  - Clean SDK 35 configuration"
echo "  - Minimal plugin set to avoid conflicts"
echo "  - Core functionality only (camera, file, device)"
echo "  - No AndroidX version conflicts"
echo "  - Cordova Android 14.0.0 compatible"
echo ""
echo "📦 Output file: gabai-apk-v41-clean-sdk35.zip"
echo ""
echo "🚀 Next steps:"
echo "  1. Upload gabai-apk-v41-clean-sdk35.zip to VoltBuilder"
echo "  2. Build APK with VoltBuilder"
echo "  3. Test core functionality"
echo ""
echo "Version: 1.0.41"
echo "Build date: $(date)"