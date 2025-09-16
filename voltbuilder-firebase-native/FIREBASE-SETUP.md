# Firebase Setup for VoltBuilder

## CRITICAL: You need to replace the placeholder google-services.json file

The current `google-services.json` file contains placeholder values and will NOT work for building your app.

### Steps to get your real Firebase configuration:

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project** (or create a new one)
3. **Add Android app** if you haven't already:
   - Package name: `ai.gabai.app`
   - App nickname: `GabAi`
4. **Download google-services.json**:
   - Go to Project Settings → General tab
   - Scroll down to "Your apps" section
   - Click the Android app you created
   - Click "Download google-services.json"
5. **Replace the file**:
   - Replace the placeholder `google-services.json` in this package
   - Re-zip the package
   - Upload to VoltBuilder

### Enable required Firebase services:

1. **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Google Sign-In
   - Add your OAuth client ID

2. **Cloud Messaging** (for notifications):
   - Already enabled by default in new projects

### Security Notes:
- The google-services.json file contains public configuration data
- It's safe to include in your mobile app package
- Your sensitive API keys are managed separately in Firebase Console

After replacing the file, your VoltBuilder build should complete successfully.