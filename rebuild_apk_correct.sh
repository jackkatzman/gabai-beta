#!/bin/bash
set -e

echo "🚀 Rebuilding APK with CORRECT structure (matching v110)..."

# Clean up
rm -rf apk-build-correct gabai-mobile.zip

# Create correct structure
mkdir -p apk-build-correct/www

# Copy ALL frontend files into www/ folder
echo "📦 Copying frontend to www/..."
cp -r dist/public/* apk-build-correct/www/

# Copy icon into www/ also
cp icon.png apk-build-correct/www/

# Copy config files to ROOT (not www)
echo "⚙️  Copying config files to root..."
cp config.xml apk-build-correct/
cp network_security_config.xml apk-build-correct/
cp icon.png apk-build-correct/

# Copy package.json to root
cp package.json apk-build-correct/

echo "📋 Structure:"
ls -la apk-build-correct/
echo ""
echo "📱 www/ contents:"
ls -la apk-build-correct/www/

# Create ZIP
echo "🗜️  Creating gabai-mobile.zip..."
cd apk-build-correct
zip -r ../gabai-mobile.zip . -x "*.DS_Store"
cd ..

echo "✅ APK created: gabai-mobile.zip"
ls -lh gabai-mobile.zip
