# 📱 GabAi Mobile Deployment Guide

## 🚀 Quick Deploy to GitHub & Build APK

### Step 1: Push to GitHub
```bash
# In Replit Shell
git add .
git commit -m "Complete GabAi with working affiliate system"
git push origin main
```

### Step 2: Automatic APK Build
- GitHub Actions will automatically build your APK on every push
- APK will be available in the "Releases" section of your repo
- Download and distribute to beta testers

## 📋 Manual Build (If Needed)

### Local Development:
```bash
# Build web app
npm run build

# Sync Capacitor
npx cap sync

# Open in Android Studio
npx cap open android
```

### In Android Studio:
1. Build → Generate Signed Bundle/APK
2. Choose APK
3. Create or use existing keystore
4. Build release APK

## 🔧 Key Configuration

### App Details:
- **App ID:** ai.gabai.app
- **App Name:** GabAi
- **Version:** Auto-incremented
- **Target:** Android 13+ (API 33+)

### Signing (Production):
```bash
# Generate keystore (one time)
keytool -genkey -v -keystore gabai-release-key.keystore -alias gabai -keyalg RSA -keysize 2048 -validity 10000

# Update capacitor.config.ts with keystore info
```

### Distribution:
- **GitHub Releases:** Automated APK distribution
- **Beta Testing:** Direct APK download links
- **Play Store:** Upload release bundle

## 📊 Monetization Ready
- ✅ Affiliate links: Amazon (floater01b-20), VRBO, Booking.com
- ✅ URL shortening with click tracking
- ✅ Analytics dashboard at /analytics
- ✅ Subscription model: $14.95/month

## 🔗 Important URLs
- **Production:** https://gabai.ai
- **Development:** https://399006af-98ce-4004-809a-fd955a60de01-00-11d3bac8de4bw.worf.replit.dev
- **Analytics:** /analytics
- **GitHub:** https://github.com/jackkatzman/gabai-beta.git

Your app is ready for deployment! 🎉