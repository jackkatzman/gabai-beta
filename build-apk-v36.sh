#!/bin/bash

# Build script for GabAI APK v36 - Production Auth Fix
# Fixes:
# - Ensures authentication works with production server
# - Adds fallback authentication methods
# - Better error handling for cross-domain requests

echo "🚀 Building GabAI APK v36 with production authentication fix..."

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
<widget id="ai.gabai.app" version="1.0.36" xmlns="http://www.w3.org/ns/widgets" xmlns:android="http://schemas.android.com/apk/res/android">
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
zip -r gabai-apk-v36-production-auth-fix.zip www config.xml res

# Clean up
echo "🧹 Cleaning up temporary files..."
rm -rf www

# Create release notes
echo "📝 Creating version documentation..."
cat > gabai-apk-v36-release-notes.md << 'EOF'
# GabAI APK v36 Release Notes

## Version: 1.0.36
## Date: $(date +"%Y-%m-%d")

### 🎯 Focus: Production Authentication Fix

### ✅ Critical Fix

#### Authentication with Production Server
- **Problem**: Token not being accepted by production server at gabai.ai
- **Cause**: Cross-domain authentication issues and server-side token validation
- **Solution**: Enhanced token handling and authentication fallbacks

### 🔧 Technical Changes

1. **Token Format Validation**
   - Ensures token is properly Base64 encoded
   - Validates token structure before sending
   - Added token refresh on authentication failure

2. **Authentication Fallbacks**
   - Multiple authentication attempts with different methods
   - Better error recovery for failed auth
   - Automatic retry with fresh credentials

3. **Cross-Domain Compatibility**
   - Fixed CORS headers for APK requests
   - Proper credentials handling for cross-origin
   - Enhanced cookie fallback support

### ✅ All Previous Fixes Included
- Voice recording toggle controls (v33)
- 3GPP audio format handling (v34)
- AI transcription to production API (v34)
- Token transmission fix (v35)
- Camera functionality
- SMS authentication
- Contact access
- Calendar export

### 📱 Testing Notes
- Clear app data before installing v36
- SMS login should work end-to-end
- Authentication persists properly
- No more 401 errors after login

### 🔍 Debug Info
If authentication still fails:
1. Check network connectivity
2. Ensure production server is accessible
3. Clear all app data and retry
4. Report specific error messages

### ⚠️ Important
The production server at gabai.ai must be running the latest authentication code for this to work properly.
EOF

echo "✅ APK build complete!"
echo "📦 Package: gabai-apk-v36-production-auth-fix.zip"
echo "📄 Release notes: gabai-apk-v36-release-notes.md"
echo ""
echo "Next steps:"
echo "1. Upload the zip file to VoltBuilder"
echo "2. Build for Android platform"
echo "3. Download and test the APK"
echo ""
echo "⚠️ IMPORTANT: The production server needs to support Bearer token authentication"