#!/bin/bash

echo "🚀 Building GabAI APK v57 - Minimal Fix"
echo "======================================"
echo "Based on working v55 + APK detection flag only"
echo ""

# Build the frontend
echo "1. Building frontend with Vite..."
npm run build

# Create v57 directory structure
echo "2. Creating voltbuilder-v57 directory..."
rm -rf voltbuilder-v57
mkdir -p voltbuilder-v57/www

# Copy built files
echo "3. Copying built files to www..."
cp -r dist/public/* voltbuilder-v57/www/

# Fix asset paths for APK
echo "4. Fixing asset paths for file:// protocol..."
cd voltbuilder-v57/www
sed -i 's|href="/assets/|href="assets/|g' index.html
sed -i 's|src="/assets/|src="assets/|g' index.html
sed -i 's|href="/|href="./|g' index.html

# Add cordova.js script tag AND the APK detection flag (ONLY NEW CHANGE)
echo "5. Adding cordova.js and APK detection flag..."
sed -i 's|</head>|  <script>window.IS_VOLTBUILDER_APK = true;</script>\n  <script src="cordova.js"></script>\n</head>|' index.html

cd ../..

# Copy the EXACT working config.xml from v55 (no changes)
echo "6. Copying working v55 config.xml exactly..."
cp voltbuilder-v55/config.xml voltbuilder-v57/config.xml
# Only change the version number
sed -i 's|version="1.0.55"|version="1.0.57"|' voltbuilder-v57/config.xml

# Copy other working v55 files exactly
echo "7. Copying working v55 build files..."
cp voltbuilder-v55/build-extras.gradle voltbuilder-v57/build-extras.gradle
cp voltbuilder-v55/voltbuilder.json voltbuilder-v57/voltbuilder.json
# Update the version in voltbuilder.json
sed -i 's|"com.gabai.app"|"ai.gabai.app"|' voltbuilder-v57/voltbuilder.json

# Create zip package
echo "8. Creating APK package..."
cd voltbuilder-v57
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="../gabai-v57-minimal-fix-${TIMESTAMP}.zip"
zip -r "$PACKAGE_NAME" . -x "*.DS_Store" "*.git*" "node_modules/*" "*.log" "*.tmp"
cd ..

# Copy to simple filename
echo "9. Copying to simple filename..."
cp "gabai-v57-minimal-fix-${TIMESTAMP}.zip" gabai-v57-minimal-fix.zip

# Show results
if [ -f gabai-v57-minimal-fix.zip ]; then
    PACKAGE_SIZE=$(du -h gabai-v57-minimal-fix.zip | cut -f1)
    echo ""
    echo "✅ APK v57 Package Created!"
    echo "=========================="
    echo "📦 Package: gabai-v57-minimal-fix.zip"
    echo "📏 Size: $PACKAGE_SIZE"
    echo ""
    echo "🔧 Changes from working v55:"
    echo "  ✅ Added window.IS_VOLTBUILDER_APK = true flag"
    echo "  ✅ Updated version to 1.0.57"
    echo "  ❌ NO config.xml changes (avoids XML errors)"
    echo "  ❌ NO plugin changes (avoids conflicts)"
    echo ""
    echo "📱 Upload to VoltBuilder: https://build.voltbuilder.com/"
    echo "=========================="
else
    echo "❌ Failed to create package!"
    exit 1
fi
