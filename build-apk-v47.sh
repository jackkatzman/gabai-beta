#!/bin/bash

echo "==================================="
echo "Building GabAi APK v47"
echo "Authentication Flow Fixes"
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

# Create config.xml with no plugins (keeping it simple)
echo "📝 Creating config.xml for v47..."
cat > config.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<widget id="ai.gabai.app" version="1.0.47" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
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
        
        <!-- Allow cleartext traffic for localhost -->
        <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application">
            <application android:usesCleartextTraffic="true" />
        </edit-config>
    </platform>
    
    <!-- Preferences with corrected color format -->
    <preference name="DisallowOverscroll" value="true" />
    <preference name="Orientation" value="default" />
    <preference name="BackgroundColor" value="#FFFFFFFF" />
    
    <!-- NO PLUGINS for now - basic functionality -->
    
    <!-- Engine requirements -->
    <engine name="android" spec="^14.0.0" />
</widget>
EOF

# Create package.json with no plugins
echo "📋 Creating package.json for VoltBuilder..."
cat > voltbuilder-package.json << 'EOF'
{
  "name": "gabai",
  "version": "1.0.47",
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
zip -r gabai-apk-v47-auth-fixes.zip www config.xml voltbuilder-package.json

echo "✅ Build complete!"
echo ""
echo "📱 APK v47 Features:"
echo "  - Fixed stuck loading after SMS verification"
echo "  - Better APK auth detection with cached user fallback"
echo "  - No reload after verification (uses hash navigation)"
echo "  - Custom auth state change event handling"
echo ""
echo "📦 Output file: gabai-apk-v47-auth-fixes.zip"
echo ""
echo "🚀 Next steps:"
echo "  1. Upload gabai-apk-v47-auth-fixes.zip to VoltBuilder"
echo "  2. Build APK with VoltBuilder"
echo "  3. Test SMS authentication flow"
echo ""
echo "Version: 1.0.47"
echo "Build date: $(date)"