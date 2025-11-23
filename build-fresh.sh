
#!/bin/bash

echo "==================================="
echo "🧹 GabAi Fresh Build Script"
echo "Cleaning all old artifacts..."
echo "==================================="

# 1. Stop any running processes
echo "🛑 Stopping running processes..."
pkill -f "npm run dev" || true
pkill -f "vite" || true

# 2. Clean all build artifacts
echo "🗑️ Removing old build artifacts..."
rm -rf dist/
rm -rf www/
rm -rf server/public/
rm -rf .vite/
rm -rf node_modules/.vite/

# 3. Clean all versioned build directories (optional - comment out if you want to keep them)
# echo "🗑️ Removing versioned build directories..."
# rm -rf voltbuilder-v*/
# rm -rf apk-build-v*/

# 4. Clear npm cache
echo "🧼 Clearing npm cache..."
npm cache clean --force

# 5. Reinstall dependencies (optional but recommended if having issues)
echo "📦 Reinstalling dependencies..."
rm -rf node_modules/
npm install

# 6. Build fresh
echo "🔨 Building fresh application..."
npm run build

# 7. Verify build
echo "✅ Verifying build..."
if [ -d "dist/public" ]; then
    echo "✅ Build successful! Files in dist/public:"
    ls -lah dist/public/
else
    echo "❌ Build failed - dist/public not found"
    exit 1
fi

# 8. Copy to server public (for deployment)
echo "📋 Copying to server/public..."
rm -rf server/public/
cp -r dist/public server/public/

echo ""
echo "==================================="
echo "✅ Fresh build complete!"
echo "==================================="
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Deploy: Use Replit's deployment feature"
echo "==================================="
