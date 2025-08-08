# Quick APK Build Guide for GabAi

## TL;DR - Just Want the APK?

**Run these commands in your Replit terminal:**

```bash
# Make sure you're in the project root, then run:
./scripts/build-apk.sh
```

That's it! The script will build everything and place the APK at `public/downloads/gabai-beta.apk`.

## Manual Steps (if script doesn't work)

If the automated script fails, here are the manual steps:

### 1. Build Web App
```bash
npm run build
```

### 2. Sync with Capacitor
```bash
npx cap sync android
```

### 3. Add Android Platform (first time only)
```bash
npx cap add android
```

### 4. Build APK
```bash
cd android
chmod +x ./gradlew
./gradlew assembleDebug
cd ..
```

### 5. Copy to Downloads
```bash
mkdir -p public/downloads
cp android/app/build/outputs/apk/debug/app-debug.apk public/downloads/gabai-beta.apk
```

## What You'll Get

- **File**: `public/downloads/gabai-beta.apk`
- **Size**: ~15-30MB (typical for Capacitor apps)
- **Download URL**: `https://your-replit-url.com/downloads/gabai-beta.apk`

## Testing the APK

1. **Install on Android Device**:
   - Enable "Install from Unknown Sources"
   - Download and install the APK
   - Allow all requested permissions

2. **Key Features to Test**:
   - Voice recognition and AI chat
   - Smart alarms with different voices
   - List creation and management
   - OCR text scanning
   - Contact management
   - Calendar integration

## Troubleshooting

### "gradlew not found"
```bash
npx cap sync android
cd android
ls -la  # Check if gradlew exists
```

### "Build failed"
```bash
# Check Android requirements
npx cap doctor

# Try cleaning and rebuilding
cd android
./gradlew clean
./gradlew assembleDebug
```

### "APK too large"
- Debug APKs are typically larger than release APKs
- For production, build release APK with ProGuard enabled

### "Permissions not working"
- Check `android/app/src/main/AndroidManifest.xml`
- Ensure all required permissions are declared

## For Replit Users

Since you're using Replit, the build process is simplified:

1. **No Android Studio Required**: The Gradle build will work in the Replit environment
2. **Java Already Available**: Replit has Java pre-installed
3. **Direct Download**: The APK will be accessible via your Replit URL

## Distribution

Once built, beta testers can:

1. **Visit Your Landing Page**: Your GabAi landing page has the beta download section
2. **Direct Link**: Share `https://your-replit-url.com/downloads/gabai-beta.apk`
3. **QR Code**: Generate a QR code for easy mobile access

## Next Steps After Building

1. **Test Thoroughly**: Install on multiple Android devices
2. **Share with Beta Testers**: Use the landing page or direct links
3. **Collect Feedback**: Set up feedback channels (email, Discord, etc.)
4. **Iterate**: Make improvements based on beta feedback
5. **Prepare for Store**: Eventually build release APK for Google Play

## Security Note

**Debug APKs are for testing only**. They're signed with a debug certificate that:
- Expires after 1 year
- Is not suitable for production
- Can be installed by anyone

For Google Play Store submission, you'll need a proper release build with your own signing key.

---

**Need Help?** 
- Check the full `BUILD-APK-GUIDE.md` for detailed instructions
- Capacitor docs: https://capacitorjs.com/docs/android
- Android developer guide: https://developer.android.com/guide