#!/bin/bash

# Build script for GabAI APK v35 - Authentication Loading Fix
# Fixes:
# - Properly sends authentication token from APK to production server
# - Fixes stuck loading after login
# - Ensures token-based auth works across domains

echo "🚀 Building GabAI APK v35 with authentication loading fix..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf www gabai-apk-*.zip 2>/dev/null

# Build the application
echo "📦 Building client application..."
npm run build

# Create www directory for VoltBuilder
echo "📂 Creating www directory..."
mkdir -p www

# Copy built files to www
echo "📋 Copying build files..."
cp -r dist/public/* www/

# Fix asset paths for APK (remove leading slash)
echo "🔧 Fixing asset paths for APK..."
sed -i 's|href="/assets/|href="assets/|g' www/index.html
sed -i 's|src="/assets/|src="assets/|g' www/index.html
sed -i 's|"/assets/|"assets/|g' www/index.html

# Add cordova.js script tag (VoltBuilder will inject the actual file)
echo "📱 Adding cordova.js to index.html..."
sed -i 's|</head>|<script src="cordova.js"></script></head>|' www/index.html

# Create VoltBuilder directory structure
echo "📁 Creating VoltBuilder structure..."
mkdir -p res/android

# Create config.xml for VoltBuilder with all required plugins
echo "⚙️ Configuring build..."
cat > config.xml << 'EOF'
<?xml version='1.0' encoding='utf-8'?>
<widget id="ai.gabai.app" version="1.0.35" xmlns="http://www.w3.org/ns/widgets" xmlns:android="http://schemas.android.com/apk/res/android">
    <name>GabAI</name>
    <description>Your AI-powered personal assistant</description>
    <author email="support@gabai.ai" href="https://gabai.ai">GabAI Team</author>
    
    <!-- Local content source for bundled app -->
    <content src="index.html" />
    
    <!-- Android platform configuration -->
    <platform name="android">
        <preference name="android-minSdkVersion" value="24" />
        <preference name="android-targetSdkVersion" value="35" />
        <preference name="android-compileSdkVersion" value="35" />
        
        <!-- Permissions -->
        <config-file parent="/manifest" target="AndroidManifest.xml">
            <uses-permission android:name="android.permission.INTERNET" />
            <uses-permission android:name="android.permission.CAMERA" />
            <uses-permission android:name="android.permission.RECORD_AUDIO" />
            <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
            <uses-permission android:name="android.permission.READ_CONTACTS" />
            <uses-permission android:name="android.permission.WRITE_CONTACTS" />
            <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
            <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
            <uses-permission android:name="android.permission.VIBRATE" />
            <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
        </config-file>
        
        <!-- Fix for Android 12+ splash screen -->
        <preference name="AndroidWindowSplashScreenAnimatedIcon" value="res/android/xxxhdpi.png" />
    </platform>
    
    <!-- Core preferences -->
    <preference name="DisallowOverscroll" value="true" />
    <preference name="Orientation" value="portrait" />
    <preference name="BackgroundColor" value="#000000" />
    <preference name="StatusBarBackgroundColor" value="#000000" />
    <preference name="StatusBarStyle" value="lightcontent" />
    
    <!-- Essential Cordova plugins -->
    <plugin name="cordova-plugin-device" />
    <plugin name="cordova-plugin-camera">
        <variable name="CAMERA_USAGE_DESCRIPTION" value="Take photos for scanning and profile" />
        <variable name="PHOTOLIBRARY_USAGE_DESCRIPTION" value="Access photos for scanning" />
    </plugin>
    <plugin name="cordova-plugin-media">
        <variable name="MICROPHONE_USAGE_DESCRIPTION" value="Record voice messages and reminders" />
    </plugin>
    <plugin name="cordova-plugin-file" />
    <plugin name="cordova-plugin-media-capture">
        <variable name="CAMERA_USAGE_DESCRIPTION" value="Capture photos and videos" />
        <variable name="MICROPHONE_USAGE_DESCRIPTION" value="Record audio messages" />
        <variable name="PHOTOLIBRARY_USAGE_DESCRIPTION" value="Save captured media" />
    </plugin>
    <plugin name="cordova-plugin-contacts">
        <variable name="CONTACTS_USAGE_DESCRIPTION" value="Access contacts for reminders" />
    </plugin>
    <plugin name="cordova-plugin-vibration" />
    <plugin name="cordova-plugin-network-information" />
    <plugin name="cordova-plugin-inappbrowser" />
    <plugin name="cordova-plugin-statusbar" />
    <plugin name="cordova-plugin-splashscreen" />
    <plugin name="cordova.plugins.diagnostic">
        <variable name="ANDROIDX_VERSION" value="1.0.0" />
        <variable name="ANDROIDX_APPCOMPAT_VERSION" value="1.2.0" />
    </plugin>
    
    <!-- CORS and security settings -->
    <access origin="*" />
    <allow-navigation href="*" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <preference name="MixedContentMode" value="0" />
    <preference name="ClearSessionCache" value="false" />
    
    <!-- Icon configuration (if not provided, defaults will be generated) -->
    <icon src="res/icon.png" />
    <platform name="android">
        <icon src="res/android/ldpi.png" density="ldpi" />
        <icon src="res/android/mdpi.png" density="mdpi" />
        <icon src="res/android/hdpi.png" density="hdpi" />
        <icon src="res/android/xhdpi.png" density="xhdpi" />
        <icon src="res/android/xxhdpi.png" density="xxhdpi" />
        <icon src="res/android/xxxhdpi.png" density="xxxhdpi" />
    </platform>
</widget>
EOF

# Generate default icons (simple colored squares with text)
echo "📱 Creating default icons..."
for size in 36:ldpi 48:mdpi 72:hdpi 96:xhdpi 144:xxhdpi 192:xxxhdpi; do
    IFS=: read -r pixels density <<< "$size"
    convert -size ${pixels}x${pixels} xc:"#4a90e2" \
            -gravity center -fill white \
            -pointsize $((pixels/3)) \
            -annotate +0+0 "G" \
            res/android/${density}.png 2>/dev/null || echo "  Warning: Could not generate ${density} icon"
done

# Create a default 512x512 icon
convert -size 512x512 xc:"#4a90e2" \
        -gravity center -fill white \
        -pointsize 170 \
        -annotate +0+0 "GabAI" \
        res/icon.png 2>/dev/null || echo "  Warning: Could not generate main icon"

# Create the package
echo "📦 Creating VoltBuilder package..."
zip -r gabai-apk-v35-auth-loading-fix.zip www config.xml res

# Clean up
echo "🧹 Cleaning up temporary files..."
rm -rf www

# Create release notes
echo "📝 Creating version documentation..."
cat > gabai-apk-v35-release-notes.md << 'EOF'
# GabAI APK v35 Release Notes

## Version: 1.0.35
## Date: $(date +"%Y-%m-%d")

### 🎯 Focus: Authentication Loading Fix

### ✅ Critical Fix

#### Stuck on Loading After Login
- **Problem**: After successful SMS/email login, app stuck on loading screen
- **Cause**: Authentication token not being properly sent to production server from APK
- **Solution**: Fixed token transmission in Authorization header for cross-domain requests

### 🔧 Technical Changes

1. **Token Authentication**
   - Properly sends Bearer token in Authorization header
   - Works across domains (Replit dev → gabai.ai production)
   - Maintains backward compatibility with cookie auth

2. **APK Detection Enhanced**
   - Better detection of APK environment
   - Includes Replit hostname in APK detection
   - Ensures proper API routing

### ✅ All Previous Fixes Included
- Voice recording toggle controls
- 3GPP audio format handling
- AI transcription to production API
- Camera functionality
- SMS authentication
- Contact access
- Calendar export

### 📱 Testing Notes
- Login should now complete successfully
- After SMS verification, app loads properly
- No more infinite loading screens
- Authentication persists across app restarts

### 🔍 Debug Info
If still experiencing issues:
1. Clear app data/cache
2. Uninstall old version
3. Install fresh v35 APK
4. Try SMS login again
EOF

echo "✅ APK build complete!"
echo "📦 Package: gabai-apk-v35-auth-loading-fix.zip"
echo "📄 Release notes: gabai-apk-v35-release-notes.md"
echo ""
echo "Next steps:"
echo "1. Upload the zip file to VoltBuilder"
echo "2. Build for Android platform"
echo "3. Download and test the APK"
echo ""
echo "⚠️ IMPORTANT: Clear app data or uninstall v34 before installing v35"