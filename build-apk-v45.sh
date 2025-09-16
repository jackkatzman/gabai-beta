#!/bin/bash

echo "==================================="
echo "Building GabAi APK v45"
echo "Absolute Minimum - Device Plugin Only"
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

# Create res/values directory structure
echo "📝 Creating colors.xml resource file..."
mkdir -p res/values
cat > res/values/colors.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="statusbar_background">#000000</color>
    <color name="background">#FFFFFFFF</color>
    <color name="primary">#4A90E2</color>
</resources>
EOF

# Create config.xml with only device plugin
echo "📝 Creating config.xml for v45 (Device plugin only)..."
cat > config.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<widget id="ai.gabai.app" version="1.0.45" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
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
        
        <!-- Include colors.xml resource file -->
        <resource-file src="res/values/colors.xml" target="app/src/main/res/values/colors.xml" />
        
        <!-- Allow cleartext traffic for localhost -->
        <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application">
            <application android:usesCleartextTraffic="true" />
        </edit-config>
        
        <!-- Add file storage preference to avoid plugin issue -->
        <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    </platform>
    
    <!-- Preferences with corrected color format -->
    <preference name="DisallowOverscroll" value="true" />
    <preference name="Orientation" value="default" />
    <preference name="BackgroundColor" value="#FFFFFFFF" />
    <preference name="SplashScreen" value="none" />
    
    <!-- Only device plugin to avoid errors -->
    <plugin name="cordova-plugin-device" />
    
    <!-- Engine requirements -->
    <engine name="android" spec="^14.0.0" />
</widget>
EOF

# Create package.json minimal
echo "📋 Creating package.json for VoltBuilder (minimal)..."
cat > voltbuilder-package.json << 'EOF'
{
  "name": "gabai",
  "version": "1.0.45",
  "description": "GabAi - Your AI Personal Assistant",
  "scripts": {
    "build": "echo 'Already built'"
  },
  "dependencies": {
    "cordova-android": "^14.0.0"
  },
  "cordova": {
    "platforms": [
      "android"
    ],
    "plugins": {
      "cordova-plugin-device": {}
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

# Clean up any old zip files in www
echo "🧹 Cleaning up old files..."
rm -f www/*.zip

# Create the zip file for VoltBuilder
echo "📦 Creating VoltBuilder package..."
zip -r gabai-apk-v45-device-only.zip www res config.xml voltbuilder-package.json

echo "✅ Build complete!"
echo ""
echo "📱 APK v45 Features:"
echo "  - Absolute minimum configuration"
echo "  - Only device plugin (no camera/file to avoid errors)"
echo "  - ChatGPT's color fixes applied"
echo "  - AndroidPersistentFileLocation set"
echo "  - Should finally build successfully!"
echo ""
echo "📦 Output file: gabai-apk-v45-device-only.zip"
echo ""
echo "🚀 Next steps:"
echo "  1. Upload gabai-apk-v45-device-only.zip to VoltBuilder"
echo "  2. Build APK with VoltBuilder"
echo "  3. Get a working base APK!"
echo ""
echo "Version: 1.0.45"
echo "Build date: $(date)"