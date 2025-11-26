#!/bin/bash

set -e  # Exit on error

echo "🚀 Building GabAI v142 for VoltBuilder"
echo "======================================"
echo "✨ Includes: Delete Account feature + all latest enhancements"

VERSION="142"
ZIP_NAME="gabai-v${VERSION}.zip"

# Step 1: Build the frontend using Vite
echo "📦 Step 1: Building frontend with Vite..."
vite build --outDir www

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build complete (www directory created)"

# Step 2: Create zip package for VoltBuilder
echo "📦 Step 2: Creating zip package..."

# Remove old zip if exists
rm -f "${ZIP_NAME}"

# Create zip with essential files
zip -r "${ZIP_NAME}" \
  config.xml \
  www/ \
  icon.png \
  network_security_config.xml \
  voltbuilder.json \
  package-voltbuilder.json \
  -x "*.DS_Store" \
  -x "*node_modules/*" \
  -x "*.git/*"

if [ $? -ne 0 ]; then
    echo "❌ Zip creation failed!"
    exit 1
fi

ZIP_SIZE=$(du -h "${ZIP_NAME}" | cut -f1)
echo "✅ Zip package created: ${ZIP_NAME} (${ZIP_SIZE})"

echo ""
echo "🎉 Build v${VERSION} ready for upload!"
echo ""
echo "📋 Next steps:"
echo "1. Upload ${ZIP_NAME} to VoltBuilder at https://volt.build/upload/"
echo "2. Select 'Android' platform and 'Release' build type"
echo "3. Wait for build to complete (~5-10 minutes)"
echo "4. Download APK and test delete account feature"
echo "5. Upload to Google Play Console"
echo ""
echo "✨ New features in v142:"
echo "  - Account deletion in Settings → Privacy & Data"
echo "  - All latest bug fixes and enhancements"
