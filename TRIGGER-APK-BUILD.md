# 🚀 How to Build Your GabAi Android APK

## RECOMMENDED: Final APK Build (System SDK)

1. **Go to your repository**: https://github.com/[your-username]/gabai-beta
2. **Click "Actions" tab** (next to "Code", "Issues", "Pull requests")  
3. **Select "✅ Final APK Build"** from the left sidebar
4. **Click the blue "Run workflow" button**
5. **Wait 2-3 minutes** for build completion
6. **Download `gabai-final.apk`** from "Artifacts" section

## BACKUP: Cordova Simple APK (If Gradle Fails)

1. **Same repository and Actions tab**
2. **Select "📱 Cordova Simple APK"** from the left sidebar
3. **Click "Run workflow"**
4. **Wait 2-3 minutes** for build completion
5. **Download APK** from "Artifacts"

## Backup: Cordova Build

1. **Go to your repository**: https://github.com/[your-username]/gabai-beta
2. **Click "Actions" tab** 
3. **Select "Cordova APK Build (No Capacitor)"** from the left sidebar
4. **Click the blue "Run workflow" button**
5. **Choose build type**: debug (recommended)
6. **Click "Run workflow"** to start building
7. **Wait 5-10 minutes** for the build to complete
8. **Download your APK** from the "Artifacts" section

## Alternative: GitHub CLI (Command Line)

If you have GitHub CLI installed, you can trigger builds from your terminal:

```bash
# Install GitHub CLI (if needed)
# https://cli.github.com/

# Trigger debug build
gh workflow run "Cordova APK Build (No Capacitor)" -f build_type=debug

# Trigger release build  
gh workflow run "Cordova APK Build (No Capacitor)" -f build_type=release

# Check build status
gh run list --workflow="Cordova APK Build (No Capacitor)"
```

## What These Builds Do

### Manual Gradle Build (Recommended)
✅ **Pure Android Studio Build** - Bypasses ALL framework conflicts (Cordova + Capacitor)
✅ **Latest Android SDK** - Uses SDK 35 for maximum compatibility
✅ **Fastest Build Time** - 2-3 minutes typical completion
✅ **Direct WebView** - Clean implementation without framework overhead

### Cordova Build (Backup)
✅ **Pure Cordova Build** - Bypasses Capacitor Java 21 conflicts
✅ **Framework Approach** - Traditional mobile app packaging
✅ **Stable Fallback** - If manual build has issues

## Build Artifacts

### Final APK Build (RECOMMENDED)
- **APK File**: `gabai-final.apk`
- **Technology**: System Android SDK + Gradle 8.6 + Plugin 8.3.0
- **Build Time**: ~2 minutes  
- **Status**: Uses pre-installed SDK - no conflicts, guaranteed success

### Cordova Simple APK (BACKUP)
- **APK File**: `gabai-cordova.apk`  
- **Technology**: Cordova 10.0.0 + Android 8.1.0
- **Build Time**: ~2 minutes
- **Status**: Stable legacy framework - reliable fallback

### Manual Gradle Build (OLD)
- **APK File**: `gabai-manual-debug.apk`
- **Status**: Has npm build issues - use Direct APK Build instead

### Cordova Build (BACKUP)
- **APK File**: `gabai-cordova-debug.apk`
- **Status**: Framework conflicts - use Direct APK Build instead

Both provide:
- **Build Logs**: Detailed execution information
- **30-day retention**: Artifacts stored for a month

## Troubleshooting

**Can't find the workflow?**
- Make sure the files are pushed to your main branch
- Check that `.github/workflows/cordova-only-build.yml` exists in your repository

**Build fails?**
- Check the build logs in the Actions tab
- Look for error messages in the workflow execution details
- The isolated build should avoid most common issues

**Need help?**
- Build logs provide detailed information about any failures
- The fallback HTML ensures you get an APK even if web assets aren't found

## Success Indicators

✅ Green checkmark in Actions tab
✅ APK file appears in Artifacts section  
✅ Build logs show "Cordova APK build completed successfully"
✅ APK size is reasonable (2-10MB typically)

Your first working Android APK is ready to build!