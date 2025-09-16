# GabAI APK v34 Release Notes

## Version: 1.0.34
## Date: $(date +"%Y-%m-%d")

### 🎯 Focus: AI Response Fix

### ✅ Fixes Applied

#### 1. API URL Routing
- Fixed transcription API URL for APK environment
- Properly routes to https://gabai.ai/api/transcribe from APK
- Includes credentials for cookie-based authentication

#### 2. Audio Format Handling
- Enhanced 3GPP format support from Android recordings
- Proper MIME type conversion for OpenAI Whisper compatibility
- Better error messages for audio format issues

#### 3. Previous Fixes Included
- Toggle recording (tap to start, tap to stop)
- Correct Cordova file paths (cacheDirectory)
- Cookie-based authentication for CORS
- Camera functionality with proper callbacks
- Phone validation (10 US digits)

### 📱 Tested Features
- ✅ Voice recording and transcription
- ✅ AI responses to voice input
- ✅ SMS authentication
- ✅ Camera access for scanning
- ✅ Contact access
- ✅ Calendar export

### 🔧 Technical Details
- Android SDK: 35
- Minimum SDK: 24 (Android 7.0+)
- Cordova Media Plugin for recording
- Cookie-based session auth
- Production API integration

### 📝 Notes
- Voice messages now properly transcribe and get AI responses
- 3GPP audio format from Android is handled correctly
- All API calls route to production server from APK
