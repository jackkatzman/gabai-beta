# 🚀 How to Build Your GabAi Android APK

## Quick Start (GitHub Web Interface)

1. **Go to your repository**: https://github.com/[your-username]/gabai-beta
2. **Click "Actions" tab** (next to "Code", "Issues", "Pull requests")
3. **Select "Cordova APK Build (No Capacitor)"** from the left sidebar
4. **Click the blue "Run workflow" button**
5. **Choose build type**:
   - `debug` - For testing (recommended first run)
   - `release` - For final distribution
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

## What This Build Does

✅ **Pure Cordova Build** - Bypasses all Capacitor Java 21 conflicts
✅ **Uses Your Web App** - Packages your actual GabAi application  
✅ **Clean Environment** - Builds in isolated directory with no dependency conflicts
✅ **Conservative Android Targets** - SDK 30, minimum SDK 21 for broad compatibility
✅ **Professional Branding** - Proper app name, icon, and metadata

## Build Artifacts

After successful build, you'll get:
- **APK File**: `gabai-cordova-apk-[debug/release].apk`
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