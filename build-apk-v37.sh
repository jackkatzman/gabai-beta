#!/bin/bash

echo "==================================="
echo "Building GabAi APK v37"
echo "Authentication & UI Improvements"
echo "==================================="

# Clean previous builds
rm -rf www dist gabai-apk-v37*.zip 2>/dev/null

# Build the frontend with Vite
echo "📦 Building frontend..."
vite build

# Build the server (if needed)
echo "📦 Building server..."
npm run build

# Prepare www directory for Cordova
echo "📱 Preparing www directory..."
mkdir -p www
cp -r dist/public/* www/

# Fix asset paths for APK (file:// protocol)
echo "🔧 Fixing asset paths for APK..."
find www -name "*.html" -exec sed -i 's|href="/|href="|g' {} \;
find www -name "*.html" -exec sed -i 's|src="/|src="|g' {} \;
find www -name "*.js" -exec sed -i 's|from"/|from"|g' {} \;
find www -name "*.js" -exec sed -i 's|import("/|import("|g' {} \;

# Remove vite.svg references and fix favicon
echo "🔧 Removing development asset references..."
find www -name "*.html" -exec sed -i '/vite\.svg/d' {} \;
# Add a blank data URL favicon to prevent 404 errors
echo "🔧 Adding inline favicon to prevent 404..."
find www -name "*.html" -exec sed -i 's|<!-- Favicon -->|<link rel="icon" href="data:image/x-icon;base64,AAABAAEAEBAAAAAAAABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==">|g' {} \;
# Also add a shortcut icon for older browsers
find www -name "*.html" -exec sed -i 's|<title>|<link rel="shortcut icon" href="data:,">\n    <title>|g' {} \;

# Create config.xml with v37 updates
echo "📝 Creating config.xml for v37..."
cat > config.xml << 'EOF'
<?xml version='1.0' encoding='utf-8'?>
<widget id="ai.gabai.app" version="1.0.37" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <name>GabAi</name>
    <description>
        GabAi - Your AI Personal Assistant v37
        Authentication improvements and better UI
    </description>
    <author email="support@gabai.ai" href="https://gabai.ai">
        GabAi Team
    </author>
    <content src="index.html" />
    <access origin="*" />
    <allow-navigation href="*" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <allow-intent href="tel:*" />
    <allow-intent href="sms:*" />
    <allow-intent href="mailto:*" />
    <allow-intent href="geo:*" />
    
    <preference name="android-minSdkVersion" value="24" />
    <preference name="android-targetSdkVersion" value="35" />
    <preference name="orientation" value="portrait" />
    <preference name="fullscreen" value="false" />
    <preference name="StatusBarStyle" value="lightcontent" />
    <preference name="StatusBarBackgroundColor" value="#3B82F6" />
    
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <platform name="android">
        <preference name="android-minSdkVersion" value="24" />
        <preference name="android-targetSdkVersion" value="35" />
        <preference name="android-compileSdkVersion" value="35" />
        <preference name="AndroidXEnabled" value="true" />
        <preference name="GradleVersion" value="8.7" />
        <preference name="AndroidGradlePluginVersion" value="8.5.0" />
        
        <!-- Icons -->
        <icon src="www/gabai-icon.png" />
        <icon src="www/gabai-icon.png" density="ldpi" />
        <icon src="www/gabai-icon.png" density="mdpi" />
        <icon src="www/gabai-icon.png" density="hdpi" />
        <icon src="www/gabai-icon.png" density="xhdpi" />
        <icon src="www/gabai-icon.png" density="xxhdpi" />
        <icon src="www/gabai-icon.png" density="xxxhdpi" />
    </platform>
    
    <!-- Core plugins -->
    <plugin name="cordova-plugin-file" spec="^8.1.2" />
    <plugin name="cordova-plugin-device" spec="^3.0.0" />
    <plugin name="cordova-plugin-statusbar" spec="^4.0.0" />
    <plugin name="cordova-plugin-splashscreen" spec="^6.0.2" />
    <plugin name="cordova-plugin-inappbrowser" spec="^6.0.0" />
    
    <!-- Diagnostic plugin for permissions -->
    <plugin name="cordova.plugins.diagnostic" spec="^7.1.4">
        <variable name="ANDROIDX_VERSION" value="1.0.0" />
        <variable name="ANDROIDX_APPCOMPAT_VERSION" value="1.6.1" />
    </plugin>
</widget>
EOF

# Create package.json for VoltBuilder in APK directory
echo "📋 Creating package.json for VoltBuilder..."
cat > apk-package.json << 'EOF'
{
  "name": "gabai-app",
  "displayName": "GabAi",
  "version": "1.0.37",
  "description": "GabAi - Your AI Personal Assistant v37",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "GabAi Team",
  "license": "Apache-2.0",
  "devDependencies": {
    "cordova-android": "^13.0.0"
  },
  "cordova": {
    "platforms": [
      "android"
    ],
    "plugins": {
      "cordova-plugin-file": {},
      "cordova-plugin-device": {},
      "cordova-plugin-statusbar": {},
      "cordova-plugin-splashscreen": {},
      "cordova-plugin-inappbrowser": {},
      "cordova.plugins.diagnostic": {
        "ANDROIDX_VERSION": "1.0.0",
        "ANDROIDX_APPCOMPAT_VERSION": "1.6.1"
      }
    }
  },
  "dependencies": {
    "cordova-plugin-file": "^8.1.2",
    "cordova-plugin-device": "^3.0.0",
    "cordova-plugin-statusbar": "^4.0.0",
    "cordova-plugin-splashscreen": "^6.0.2",
    "cordova-plugin-inappbrowser": "^6.0.0",
    "cordova.plugins.diagnostic": "^7.1.4"
  }
}
EOF

# Create simple icon
echo "🎨 Creating GabAi icon..."
convert -size 192x192 xc:'#3B82F6' -fill white -gravity center \
  -pointsize 72 -annotate +0+0 'G' www/gabai-icon.png 2>/dev/null || \
  cp www/favicon.ico www/gabai-icon.png 2>/dev/null || \
  echo "Warning: Could not create icon"

# Package for VoltBuilder
echo "📦 Creating VoltBuilder package..."
# Copy apk-package.json as package.json for the zip
cp apk-package.json voltbuilder-package.json
zip -r gabai-apk-v37-auth-improvements.zip www config.xml
# Add the package.json to the zip with the correct name
zip -u gabai-apk-v37-auth-improvements.zip -j voltbuilder-package.json
# Rename it inside the zip
printf "@ voltbuilder-package.json\n@=package.json\n" | zipnote -w gabai-apk-v37-auth-improvements.zip 2>/dev/null || true
rm voltbuilder-package.json 2>/dev/null

echo "✅ Build complete!"
echo ""
echo "📱 APK v37 Features:"
echo "  - Simplified authentication for APK users"
echo "  - Improved phone verification UI with GabAi branding"
echo "  - Better phone number input (easier editing)"
echo "  - Fixed redirect to chat after SMS verification"
echo "  - Bearer token authentication support"
echo ""
echo "📦 Output file: gabai-apk-v37-auth-improvements.zip"
echo ""
echo "🚀 Next steps:"
echo "  1. Upload gabai-apk-v37-auth-improvements.zip to VoltBuilder"
echo "  2. Build APK with VoltBuilder"
echo "  3. Test SMS authentication flow"
echo ""
echo "Version: 1.0.37"
echo "Build date: $(date)"