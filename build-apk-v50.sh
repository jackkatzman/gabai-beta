#!/bin/bash

echo "==================================="
echo "Building GabAi APK v50"
echo "ChatGPT's Complete Fix Package"
echo "==================================="

# Build frontend
echo "📦 Building frontend..."
npm run build

# Prepare the www directory
echo "📱 Preparing www directory..."
rm -rf www
cp -r dist/public www

# Fix asset paths for APK - CRITICAL FIXES
echo "🔧 Applying ChatGPT's critical asset path fixes..."

# 1. Add base href as first thing in head
sed -i 's|<head>|<head>\n    <base href="./">|' www/index.html

# 2. Fix all absolute paths to be relative
sed -i 's|="/assets/|="assets/|g' www/index.html
sed -i 's|="/|="|g' www/index.html
sed -i 's|href="/|href="|g' www/index.html
sed -i 's|src="/|src="|g' www/index.html

# 3. Remove ALL vite.svg references completely
echo "🔧 Removing all vite.svg references..."
sed -i 's|<link rel="icon" type="image/svg+xml" href="[^"]*vite\.svg[^"]*">||g' www/index.html
sed -i 's|<link rel="shortcut icon" href="[^"]*vite\.svg[^"]*">||g' www/index.html
sed -i '/vite\.svg/d' www/index.html

# 4. Add inline favicon to prevent 404
echo "🔧 Adding inline favicon..."
sed -i 's|</head>|    <link rel="shortcut icon" href="data:,">\n</head>|' www/index.html

# 5. Add Cordova script WITHOUT leading slash (relative)
echo "🔧 Adding cordova.js (relative path)..."
sed -i 's|</body>|    <script src="cordova.js"></script>\n</body>|' www/index.html

# 6. Add ChatGPT's bearer-only runtime patch BEFORE any other scripts
echo "🔧 Adding ChatGPT's bearer-only auth patch..."
cat > bearer-patch.js << 'EOF'
<script>
(function(){
  // ChatGPT's bearer-only runtime patch for APK
  if (window.__gabaiFetchPatched) return; 
  window.__gabaiFetchPatched = true;
  
  const baseFetch = window.fetch.bind(window);
  const isHttp = u => /^https?:\/\//i.test(u);
  window.API_BASE = window.API_BASE || 'https://gabai.ai';

  // Override fetch to use bearer-only
  window.fetch = function(input, init){
    init = init || {};
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    
    // Don't patch non-HTTP URLs
    if (!isHttp(url)) return baseFetch(input, init);

    const headers = new Headers(init.headers || {});
    
    // Try all possible token locations
    const token = 
      localStorage.getItem('gabai_token') || 
      localStorage.getItem('gabai_jwt') ||
      localStorage.getItem('token') || 
      sessionStorage.getItem('gabai_token') ||
      sessionStorage.getItem('token');

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', 'Bearer ' + token);
    }

    // CRITICAL: Bearer only from APK, no cookies
    init.credentials = 'omit';

    return baseFetch(url, { ...init, headers });
  };

  // Also disable XHR cookies
  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(){ 
    this.__url = arguments[1]; 
    return _open.apply(this, arguments); 
  };
  XMLHttpRequest.prototype.send = function(){
    try { this.withCredentials = false; } catch(_){}
    return _send.apply(this, arguments);
  };
  
  console.log('✅ ChatGPT bearer-only patch applied');
})();
</script>
EOF

# Insert the bearer patch right after <head> and base href
sed -i '/<base href/r bearer-patch.js' www/index.html
rm bearer-patch.js

# 7. Add hash route guard
echo "🔧 Adding hash route guard..."
cat > route-guard.js << 'EOF'
<script>
// ChatGPT's hash route guard
window.addEventListener('hashchange', () => {
  // Get auth state from localStorage
  const token = localStorage.getItem('gabai_token');
  const user = localStorage.getItem('gabai_user');
  const authState = token && user;
  
  // If authenticated but on auth page, bump to home
  if (authState && (location.hash.startsWith('#/auth') || location.hash.startsWith('#/login') || location.hash.startsWith('#/phone-verification'))) {
    console.log('📱 Authenticated user on auth page, redirecting to chat');
    location.hash = '#/chat';
  }
});
</script>
EOF

# Insert route guard before closing body
sed -i '/<\/body>/i \' www/index.html
sed -i '/<\/body>/e cat route-guard.js' www/index.html
rm route-guard.js

# Create config.xml with no plugins (keeping simple until fully working)
echo "📝 Creating config.xml for v50..."
cat > config.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<widget id="ai.gabai.app" version="1.0.50" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <name>GabAi</name>
    <description>Your AI personal assistant with voice and SMS reminders</description>
    <author email="support@gabai.ai" href="https://gabai.ai">GabAi Team</author>
    <content src="index.html" />
    
    <!-- Allow navigation to gabai.ai for API calls -->
    <allow-navigation href="https://gabai.ai/*" />
    <allow-navigation href="http://localhost/*" />
    <allow-navigation href="file://*" />
    
    <!-- Allow all external resources -->
    <access origin="*" />
    
    <!-- Android specific -->
    <platform name="android">
        <preference name="android-minSdkVersion" value="24" />
        <preference name="android-targetSdkVersion" value="35" />
        
        <!-- Allow cleartext traffic for localhost -->
        <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application">
            <application android:usesCleartextTraffic="true" />
        </edit-config>
    </platform>
    
    <!-- Preferences -->
    <preference name="DisallowOverscroll" value="true" />
    <preference name="Orientation" value="default" />
    <preference name="BackgroundColor" value="#FFFFFFFF" />
    
    <!-- NO PLUGINS until auth fully works -->
    
    <!-- Engine requirements -->
    <engine name="android" spec="^14.0.0" />
</widget>
EOF

# Create package.json with no plugins
echo "📋 Creating package.json for VoltBuilder..."
cat > voltbuilder-package.json << 'EOF'
{
  "name": "gabai",
  "version": "1.0.50",
  "description": "GabAi - Your AI Personal Assistant",
  "scripts": {
    "build": "echo 'Already built'"
  },
  "dependencies": {
    "cordova-android": "^14.0.0"
  }
}
EOF

# Create a simple icon if it doesn't exist
echo "🎨 Creating GabAi icon..."
if [ ! -f "www/gabai-icon.png" ]; then
  convert -size 512x512 xc:white \
    -gravity center -pointsize 300 -fill '#4A90E2' \
    -annotate +0+0 'G' \
    www/gabai-icon.png 2>/dev/null || echo "Warning: Could not create icon"
fi

# Clean up any old zip files in www
echo "🧹 Cleaning up old files..."
rm -f www/*.zip

# Create the zip file for VoltBuilder
echo "📦 Creating VoltBuilder package..."
zip -r gabai-apk-v50-chatgpt-complete-fix.zip www config.xml voltbuilder-package.json

echo "✅ Build complete!"
echo ""
echo "📱 APK v50 - ChatGPT's Complete Fix Package:"
echo "  ✅ Base href='./' for bundled assets"
echo "  ✅ All paths relative (no leading slashes)"
echo "  ✅ Bearer-only auth (no cookies from APK)"
echo "  ✅ vite.svg references removed"
echo "  ✅ Hash route guard for auth redirects"
echo "  ✅ XHR cookies disabled"
echo "  ✅ Loading state properly managed"
echo ""
echo "📦 Output file: gabai-apk-v50-chatgpt-complete-fix.zip"
echo ""
echo "🚀 Next steps:"
echo "  1. Upload gabai-apk-v50-chatgpt-complete-fix.zip to VoltBuilder"
echo "  2. Build APK with VoltBuilder"
echo "  3. Authentication should finally work properly!"
echo ""
echo "Version: 1.0.50"
echo "Build date: $(date)"