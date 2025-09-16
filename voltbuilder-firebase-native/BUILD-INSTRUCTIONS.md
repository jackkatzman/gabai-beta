# GabAi Firebase Native VoltBuilder Package

This package includes Firebase native plugins for proper Google Sign-In and SMS/OTP authentication in your Android app.

## What's Included

### Firebase Native Plugins
- `cordova-plugin-firebasex@18.5.0` - Firebase native bridge
- `cordova-plugin-inappbrowser@6.0.0` - In-app browser for OAuth flows
- `cordova-plugin-whitelist@1.3.5` - Security whitelist for Firebase domains

### Core Cordova Plugins
- `cordova-plugin-device@3.0.0` - Device information
- `cordova-plugin-splashscreen@6.0.2` - Splash screen management
- `cordova-plugin-statusbar@4.0.0` - Status bar control
- `cordova-plugin-network-information@3.0.0` - Network connectivity

## REQUIRED: Before Building

### 1. Add google-services.json
You MUST add your `google-services.json` file to this directory before zipping for VoltBuilder.

Get it from: Firebase Console → Project settings → Your Android app (ai.gabai.app)

### 2. Firebase Console Setup
- Enable **Google** and **Phone** authentication methods
- Add your **SHA-1** fingerprint from your release keystore
- Enable **Play Integrity/SafetyNet** for Phone Auth
- Package name must be: `ai.gabai.app`

### 3. Test Phone Number (Optional)
Add a test phone number in Firebase Auth → Phone → "Phone numbers for testing"

## Build Process

1. Add your `google-services.json` to this directory
2. Zip the entire directory
3. Upload to VoltBuilder
4. Use the same signing keystore whose SHA-1 you registered in Firebase

## Authentication Flow

With these plugins, your app will:
- Use native Google Sign-In (not web popup)
- Support Firebase Phone Auth with SMS verification
- Work properly in Android WebView environment

## Troubleshooting

- **Google Sign-In fails**: Check SHA-1 fingerprint matches in Firebase Console
- **SMS not received**: Verify Play Integrity is enabled and test on real device
- **Build fails**: Ensure google-services.json is present and valid