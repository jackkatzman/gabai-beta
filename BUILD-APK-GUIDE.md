# GabAi Beta APK Build Guide

This guide explains how to build and distribute the GabAi Android APK for beta testing.

## Prerequisites

### Required Software
1. **Node.js 18+** (already installed in Replit)
2. **Android Studio** with Android SDK
3. **Java JDK 11 or 17**
4. **Capacitor CLI** (already installed)

### Android Studio Setup
1. Download Android Studio from https://developer.android.com/studio
2. Install Android SDK Platform 33 (API 33)
3. Install Android SDK Build-Tools 33.0.0+
4. Set up Android SDK path in environment variables

## Build Process

### Step 1: Prepare the Web Build
```bash
# Build the optimized web version
npm run build

# Sync with Capacitor (copies web assets to native projects)
npx cap sync android
```

### Step 2: Configure Android Project
```bash
# Open Android project in Android Studio
npx cap open android
```

### Step 3: Build APK Options

#### Option A: Debug APK (Recommended for Beta)
```bash
# Build debug APK via command line
cd android
./gradlew assembleDebug

# APK will be generated at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### Option B: Release APK (For Production)
```bash
# Generate signing key first (one-time setup)
keytool -genkey -v -keystore gabai-release-key.keystore -alias gabai -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
cd android
./gradlew assembleRelease

# APK will be generated at:
# android/app/build/outputs/apk/release/app-release.apk
```

### Step 4: Copy APK to Downloads
```bash
# Copy the generated APK to your public downloads folder
cp android/app/build/outputs/apk/debug/app-debug.apk public/downloads/gabai-beta.apk

# Or for release build:
cp android/app/build/outputs/apk/release/app-release.apk public/downloads/gabai-beta.apk
```

## Alternative: Replit Mobile Build

Since you're using Replit, you can also build directly in the cloud:

### Using GitHub Codespaces + Android Build Action
1. Push your code to GitHub
2. Set up GitHub Actions workflow for Android builds
3. Download the generated APK artifact

### Using Replit + External Build Service
1. Use services like Bitrise, CircleCI, or GitHub Actions
2. Connect your Replit repository
3. Set up automated APK builds

## Quick Build Script

Create this script to automate the process:

```bash
#!/bin/bash
# build-apk.sh

echo "🚀 Building GabAi Beta APK..."

# Build web assets
echo "📦 Building web application..."
npm run build

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# Build APK
echo "🔨 Building Android APK..."
cd android
./gradlew assembleDebug

# Copy to downloads
echo "📥 Copying APK to downloads..."
cp app/build/outputs/apk/debug/app-debug.apk ../public/downloads/gabai-beta.apk

echo "✅ Beta APK ready at: public/downloads/gabai-beta.apk"
echo "📱 File size: $(du -h ../public/downloads/gabai-beta.apk | cut -f1)"
echo "🔗 Download URL: https://your-domain.com/downloads/gabai-beta.apk"
```

## Configuration Files

### android/app/build.gradle
```gradle
android {
    compileSdkVersion 33
    defaultConfig {
        applicationId "com.gabai.app"
        minSdkVersion 24
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0-beta.1"
    }
    
    buildTypes {
        debug {
            debuggable true
            minifyEnabled false
        }
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gabai.app',
  appName: 'GabAi',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
```

## Testing the APK

### Before Distribution
1. **Install on Test Device**: Test the APK on multiple Android devices
2. **Check Permissions**: Verify all required permissions work
3. **Test Core Features**: Voice recognition, alarms, lists, OCR
4. **Performance Test**: Check battery usage and memory consumption

### Beta Distribution Checklist
- [ ] APK builds successfully
- [ ] App installs without errors
- [ ] All core features functional
- [ ] Proper app icon and splash screen
- [ ] Permissions requested correctly
- [ ] No critical crashes
- [ ] Performance acceptable

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Android SDK path and Java version
2. **Permission Errors**: Update AndroidManifest.xml
3. **Large APK Size**: Enable ProGuard and remove unused resources
4. **Capacitor Sync Issues**: Clean and rebuild

### Size Optimization
```bash
# Enable APK splitting by ABI
android {
    splits {
        abi {
            enable true
            reset()
            include "arm64-v8a", "armeabi-v7a"
        }
    }
}
```

## Automated Build Pipeline

For continuous beta distribution, set up:
1. **GitHub Actions** for automated builds
2. **Firebase App Distribution** for beta delivery
3. **Slack/Discord notifications** for new builds
4. **Automatic version increment**

---

**Next Steps:**
1. Follow this guide to build your first APK
2. Test thoroughly on multiple devices
3. Distribute to beta testers
4. Collect feedback and iterate
5. Prepare for Google Play Store submission

**Need Help?**
- Check the Capacitor documentation: https://capacitorjs.com/docs/android
- Android developer guide: https://developer.android.com/guide