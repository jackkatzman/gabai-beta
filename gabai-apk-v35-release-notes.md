# GabAI APK v35 Release Notes

## Version: 1.0.35
## Date: $(date +"%Y-%m-%d")

### 🎯 Focus: Authentication Loading Fix

### ✅ Critical Fix

#### Stuck on Loading After Login
- **Problem**: After successful SMS/email login, app stuck on loading screen
- **Cause**: Authentication token not being properly sent to production server from APK
- **Solution**: Fixed token transmission in Authorization header for cross-domain requests

### 🔧 Technical Changes

1. **Token Authentication**
   - Properly sends Bearer token in Authorization header
   - Works across domains (Replit dev → gabai.ai production)
   - Maintains backward compatibility with cookie auth

2. **APK Detection Enhanced**
   - Better detection of APK environment
   - Includes Replit hostname in APK detection
   - Ensures proper API routing

### ✅ All Previous Fixes Included
- Voice recording toggle controls
- 3GPP audio format handling
- AI transcription to production API
- Camera functionality
- SMS authentication
- Contact access
- Calendar export

### 📱 Testing Notes
- Login should now complete successfully
- After SMS verification, app loads properly
- No more infinite loading screens
- Authentication persists across app restarts

### 🔍 Debug Info
If still experiencing issues:
1. Clear app data/cache
2. Uninstall old version
3. Install fresh v35 APK
4. Try SMS login again
