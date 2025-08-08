# GitHub Actions APK Build Setup

## Quick Start (5 Minutes to APK)

### Step 1: Push to GitHub
If your code isn't on GitHub yet:

```bash
# Initialize git (if needed)
git init
git add .
git commit -m "Initial GabAi setup with APK build"

# Create GitHub repo and push
# Go to github.com, create new repository "gabai"
git remote add origin https://github.com/YOUR_USERNAME/gabai.git
git branch -M main
git push -u origin main
```

### Step 2: Automatic Build Triggers
Once pushed, GitHub Actions will automatically:
- ✅ **Build your web app** (`npm run build`)
- ✅ **Sync with Capacitor** (`npx cap sync android`) 
- ✅ **Compile Android APK** (`./gradlew assembleDebug`)
- ✅ **Create GitHub Release** with downloadable APK
- ✅ **Upload artifacts** for easy download

### Step 3: Download Your APK
After the build completes (~5-10 minutes):

1. **Go to GitHub Actions tab** in your repository
2. **Click the latest workflow run** (green checkmark)
3. **Download "gabai-beta-apk" artifact** 
4. **Or go to Releases** for the auto-created release

### Step 4: Add to Your Replit
```bash
# Download the APK and copy to your downloads folder
cp ~/Downloads/app-debug.apk public/downloads/gabai-beta.apk
```

## What You Get

### Automatic Releases
Every time you push code:
- **New beta release** created automatically
- **Version incrementing** (beta-1, beta-2, etc.)
- **Release notes** with feature list
- **Direct APK download** link

### Build Artifacts
- **APK file**: `app-debug.apk` (~20-30MB)
- **Build logs**: Full compilation details
- **Test reports**: Any build issues clearly shown

### Professional Distribution
- **GitHub Releases page**: Professional download experience
- **Version history**: Track all beta releases
- **Release notes**: Automatic feature documentation
- **Download stats**: See how many people download

## Repository Structure

Your GitHub repo will have:
```
gabai/
├── .github/workflows/build-android.yml  ← Build automation
├── android/                             ← Native Android project
├── client/                              ← React frontend
├── server/                              ← Express backend
├── public/downloads/                    ← APK hosting
├── capacitor.config.ts                  ← Mobile app config
└── package.json                         ← Dependencies
```

## Build Status & Monitoring

### GitHub Actions Dashboard
- **Build status**: See if builds pass/fail
- **Build time**: ~5-10 minutes typically
- **Artifact downloads**: Track beta distribution
- **Build history**: See all previous builds

### Release Management
- **Auto-versioning**: `beta-1`, `beta-2`, etc.
- **Release notes**: Features included in each build
- **Pre-release tagging**: Marked as beta releases
- **Download tracking**: GitHub provides analytics

## Advanced Features

### Pull Request Builds
The workflow also builds APKs for pull requests:
- **Test changes** before merging
- **Download APK** from PR artifacts
- **Automatic comments** with download links

### Manual Builds
You can trigger builds manually:
1. **Go to Actions tab**
2. **Select "Build Android APK"**
3. **Click "Run workflow"**
4. **Choose branch** and run

### Multiple Variants
Easy to extend for:
- **Release builds** (production-signed)
- **Different architectures** (ARM, x86)
- **Multiple environments** (staging, production)

## Next Steps After Setup

### Immediate Testing
1. **Download first APK** from GitHub release
2. **Copy to** `public/downloads/gabai-beta.apk`
3. **Test installation** on Android device
4. **Verify all features** work correctly

### Beta Distribution
1. **Share GitHub release link** with testers
2. **Use your landing page** beta download section
3. **Direct APK links** from GitHub releases
4. **QR codes** for easy mobile access

### Continuous Development
1. **Push code changes** to trigger new builds
2. **Monitor build status** in Actions tab
3. **Download latest APK** for testing
4. **Distribute to beta testers** automatically

## Troubleshooting

### Build Failures
- **Check Actions tab** for detailed error logs
- **Common issues**: Dependencies, Android SDK versions
- **Solutions**: Usually fixed by updating versions

### APK Issues
- **Download artifacts** if releases fail
- **Manual testing**: Install APK and test features
- **Version conflicts**: Clear Android app data

### Distribution Problems
- **GitHub releases public**: Anyone can download
- **Private repos**: Limited to repo collaborators
- **External hosting**: Can copy APK to other services

## Security & Signing

### Debug Builds (Current)
- **Debug keystore**: Automatically generated
- **Good for**: Beta testing, development
- **Limitations**: 1-year expiry, debug-only

### Production Builds (Future)
- **Release keystore**: Your own signing key
- **Required for**: Google Play Store
- **Setup**: Generate keystore, add secrets to GitHub

## Cost & Limits

### GitHub Actions (Free Tier)
- **2000 minutes/month** free for public repos
- **Each APK build**: ~10 minutes
- **~200 builds/month** free
- **Unlimited** for public repositories

### Storage
- **Artifacts**: 500MB free storage
- **Releases**: Unlimited for public repos
- **Cleanup**: Automatic after 30 days

---

**Ready to start?** Just push your code to GitHub and watch the magic happen! Your first APK will be ready in about 10 minutes.