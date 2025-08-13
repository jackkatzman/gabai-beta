# 🚀 VoltBuilder Setup for GabAi APK Builds

## Why VoltBuilder?
- **Direct Appflow Replacement**: Designed specifically for Capacitor apps
- **No Java Toolchain Issues**: Cloud environment handles all Java version conflicts automatically
- **Professional Mobile CI/CD**: $15/month for unlimited builds with iOS/Android support
- **Zero Local Dependencies**: No Android SDK, Java, or Gradle setup required

## Setup Process

### 1. Account Setup
- Visit: https://volt.build/
- Sign up for Indy Plan ($15/month)
- First 15 days are free

### 2. Project Structure Required
```
project-root/
├── android/ (optional - we already have this)
├── capacitor.config.json ✅
├── certificates/
│   └── android.keystore (for signed APKs)
├── package.json ✅
├── public/ ✅
└── voltbuilder.json (NEW - configuration file)
```

### 3. VoltBuilder Configuration
Create `voltbuilder.json`:
```json
{
  "title": "GabAi",
  "id": "com.gabai.app",
  "framework": "Capacitor",
  "template": "Capacitor-7",
  "certificate": "certificates/android.keystore",
  "keystorePassword": "your-keystore-password",
  "keyAlias": "your-key-alias",
  "keyPassword": "your-key-password"
}
```

### 4. Build Process
1. **Zip entire project** (excluding node_modules, .git)
2. **Upload to VoltBuilder**
3. **Download APK** - ready in minutes

## Advantages Over GitHub Actions
- ✅ **No Java version conflicts** - VoltBuilder handles Java 21 requirements automatically
- ✅ **Professional mobile build environment** - optimized for Capacitor
- ✅ **Handles certificate signing** - store-ready APKs
- ✅ **iOS support included** - same price for both platforms
- ✅ **No maintenance overhead** - no build script debugging

## Cost Comparison
- **GitHub Actions**: Free but requires extensive maintenance and debugging
- **VoltBuilder**: $15/month but eliminates all build complexity

## Next Steps
1. Set up VoltBuilder account
2. Create voltbuilder.json configuration
3. Generate Android keystore for signing
4. Test first build

This approach eliminates the Java toolchain issues we've been fighting and provides a professional mobile app build pipeline.