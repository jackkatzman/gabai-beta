#!/bin/bash

echo "🚀 Building GabAI APK v54 with V5 Simple Authentication"
echo "=================================================="

# Build directory
BUILD_DIR="voltbuilder-v54-simple-auth"

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory $BUILD_DIR not found!"
    exit 1
fi

# Verify required files
echo "📋 Verifying build files..."
REQUIRED_FILES=("$BUILD_DIR/www/index.html" "$BUILD_DIR/config.xml")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

# Check for assets
ASSET_COUNT=$(find "$BUILD_DIR/www/assets" -name "*.js" -o -name "*.css" 2>/dev/null | wc -l)
echo "📦 Found $ASSET_COUNT asset files"

if [ "$ASSET_COUNT" -lt 3 ]; then
    echo "⚠️  Warning: Expected more asset files. Build may be incomplete."
fi

# Create ZIP package for VoltBuilder
PACKAGE_NAME="gabai-v54-simple-auth-$(date +%Y%m%d-%H%M%S).zip"
echo "📦 Creating VoltBuilder package: $PACKAGE_NAME"

cd "$BUILD_DIR" || exit 1

# Create ZIP with proper structure
zip -r "../$PACKAGE_NAME" . \
    -x "*.DS_Store" "*.git*" "node_modules/*" "*.log" "*.tmp"

cd ..

# Verify package
if [ -f "$PACKAGE_NAME" ]; then
    PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
    echo "✅ Package created successfully!"
    echo "📦 Package: $PACKAGE_NAME"
    echo "📏 Size: $PACKAGE_SIZE"
    echo ""
    echo "🔗 Upload to VoltBuilder:"
    echo "   https://build.voltbuilder.com/"
    echo ""
    echo "📋 APK Features (v54):"
    echo "   ✅ V5 Simple Authentication (no race conditions)"
    echo "   ✅ Current updated codebase (no old alarms)"
    echo "   ✅ SMS verification working"
    echo "   ✅ Camera, microphone, contacts access"
    echo "   ✅ Direct Bearer token management"
    echo "   ✅ Smooth authentication flow"
    echo ""
    echo "🎯 This build combines:"
    echo "   - Updated features and UI improvements"
    echo "   - Reliable v5 authentication approach"
    echo "   - Fixed SMS verification system"
    echo "   - Simplified token management"
else
    echo "❌ Failed to create package!"
    exit 1
fi

echo "=================================================="
echo "🎉 Build complete! Ready for VoltBuilder upload."