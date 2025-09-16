#!/bin/bash

# Create VoltBuilder package for GabAI APK

echo "📦 Preparing VoltBuilder package..."

# Ensure build is fresh
echo "🔨 Building application..."
npm run build

# Create package directory
rm -rf voltbuilder-package
mkdir -p voltbuilder-package

# Copy built files
echo "📂 Copying built files..."
cp -r dist/public/* voltbuilder-package/

# Create config.xml in package directory
echo "📝 Creating config.xml..."
cat > voltbuilder-package/config.xml << 'EOF'
<?xml version='1.0' encoding='utf-8'?>
<widget id="ai.gabai.app" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:android="http://schemas.android.com/apk/res/android">
    <name>GabAi</name>
    <description>Your Personal AI Assistant</description>
    <author email="support@gabai.ai" href="https://gabai.ai">
        GabAi Team
    </author>
    <content src="index.html" />
    
    <!-- Allow navigation and API access -->
    <allow-navigation href="*" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <allow-intent href="tel:*" />
    <allow-intent href="sms:*" />
    <allow-intent href="mailto:*" />
    <allow-intent href="geo:*" />
    
    <!-- Preferences -->
    <preference name="Orientation" value="portrait" />
    <preference name="Fullscreen" value="false" />
    <preference name="BackupWebStorage" value="local" />
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    <preference name="AndroidInsecureFileModeEnabled" value="true" />
    <preference name="AndroidHttpCacheMode" value="cache" />
    <preference name="android-minSdkVersion" value="22" />
    <preference name="android-targetSdkVersion" value="35" />
    <preference name="android-compileSdkVersion" value="35" />
    
    <!-- Platform specific config -->
    <platform name="android">
        <!-- Allow cleartext traffic for development -->
        <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application">
            <application android:usesCleartextTraffic="true" />
        </edit-config>
        
        <!-- Permissions -->
        <config-file parent="/*" target="AndroidManifest.xml">
            <!-- Core permissions -->
            <uses-permission android:name="android.permission.INTERNET" />
            <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
            <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
            
            <!-- Notification permissions -->
            <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
            <uses-permission android:name="android.permission.VIBRATE" />
            <uses-permission android:name="android.permission.WAKE_LOCK" />
            <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
            <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
            <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
            
            <!-- Audio permissions -->
            <uses-permission android:name="android.permission.RECORD_AUDIO" />
            <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
            
            <!-- Calendar permissions -->
            <uses-permission android:name="android.permission.READ_CALENDAR" />
            <uses-permission android:name="android.permission.WRITE_CALENDAR" />
            
            <!-- Camera permissions -->
            <uses-permission android:name="android.permission.CAMERA" />
            <uses-feature android:name="android.hardware.camera" android:required="false" />
            <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
            
            <!-- Storage permissions -->
            <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
            <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
            <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
            <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
            <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
            
            <!-- Contacts permissions -->
            <uses-permission android:name="android.permission.READ_CONTACTS" />
            
            <!-- SMS permissions -->
            <uses-permission android:name="android.permission.SEND_SMS" />
            <uses-permission android:name="android.permission.RECEIVE_SMS" />
            <uses-permission android:name="android.permission.READ_SMS" />
            <uses-permission android:name="android.permission.RECEIVE_MMS" />
            <uses-permission android:name="android.permission.READ_PHONE_STATE" />
            
            <!-- Location permissions (for location-based reminders) -->
            <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
            <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
            <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
            
            <!-- Other useful permissions -->
            <uses-permission android:name="android.permission.BLUETOOTH" />
            <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
            <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
            <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
            <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
            <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
            <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
            
            <!-- Activity recognition for context awareness -->
            <uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
            <uses-permission android:name="com.google.android.gms.permission.ACTIVITY_RECOGNITION" />
            
            <!-- Biometric authentication -->
            <uses-permission android:name="android.permission.USE_BIOMETRIC" />
            <uses-permission android:name="android.permission.USE_FINGERPRINT" />
        </config-file>
        
        <!-- Icons and splash screens can be added here -->
    </platform>
</widget>
EOF

# Create the zip file
echo "🗜️ Creating zip package..."
cd voltbuilder-package
zip -r ../gabai-voltbuilder.zip .
cd ..

echo "✅ VoltBuilder package created: gabai-voltbuilder.zip"
echo ""
echo "📋 Next steps:"
echo "1. Download gabai-voltbuilder.zip"
echo "2. Upload to VoltBuilder.com"
echo "3. Build APK with all permissions included"
echo ""
echo "🔑 The package includes:"
echo "  - All required Android permissions"
echo "  - API connectivity (relative URLs, no hardcoded domains)"
echo "  - SMS authentication support"
echo "  - Calendar, notifications, microphone access"
echo ""
ls -lh gabai-voltbuilder.zip