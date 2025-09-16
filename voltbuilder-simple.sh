#!/bin/bash

echo "📦 Creating SIMPLE VoltBuilder package (like the original working one)..."

# Clean up
rm -rf voltbuilder-simple
mkdir voltbuilder-simple

# Copy built files
cp -r dist/public/* voltbuilder-simple/

# Fix paths in index.html (make them relative for APK)
cd voltbuilder-simple
sed -i 's|href="/|href="|g; s|src="/|src="|g' index.html
sed -i '/manifest.json/d; /vite.svg/d' index.html

# Create config.xml with permissions
cat > config.xml << 'EOF'
<?xml version='1.0' encoding='utf-8'?>
<widget id="ai.gabai.app" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:android="http://schemas.android.com/apk/res/android">
    <name>GabAi</name>
    <description>Your Personal AI Assistant</description>
    <author email="support@gabai.ai" href="https://gabai.ai">
        GabAi Team
    </author>
    <content src="index.html" />
    
    <!-- Allow navigation -->
    <allow-navigation href="*" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    
    <!-- Preferences -->
    <preference name="android-minSdkVersion" value="22" />
    <preference name="android-targetSdkVersion" value="35" />
    
    <!-- Platform specific config -->
    <platform name="android">
        <!-- Permissions -->
        <config-file parent="/*" target="AndroidManifest.xml">
            <uses-permission android:name="android.permission.INTERNET" />
            <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
            <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
            <uses-permission android:name="android.permission.VIBRATE" />
            <uses-permission android:name="android.permission.RECORD_AUDIO" />
            <uses-permission android:name="android.permission.READ_CALENDAR" />
            <uses-permission android:name="android.permission.WRITE_CALENDAR" />
            <uses-permission android:name="android.permission.CAMERA" />
            <uses-permission android:name="android.permission.READ_CONTACTS" />
        </config-file>
    </platform>
</widget>
EOF

# Create the zip
zip -r ../gabai-simple.zip .
cd ..

echo "✅ Simple package created: gabai-simple.zip"
echo ""
echo "This is like your ORIGINAL WORKING APK:"
echo "  - No fetch interceptors"
echo "  - No API detection"
echo "  - Just relative URLs"
echo "  - Clean and simple"
echo "  - With permissions added"
echo ""
ls -lh gabai-simple.zip