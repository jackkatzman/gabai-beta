# GabAi v3.0.87 - Native Sharing & Contact Picker Restoration

## Release Date: October 3, 2025

### 🚨 Critical Fixes
1. **Restored Contact Picker Functionality**:
   - **Re-added missing `cordova-plugin-contacts` plugin**
   - This was present in v70 but accidentally removed in v78
   - Contact picker for SMS reminders now works again
   - Added back READ_CONTACTS and WRITE_CONTACTS permissions

2. **Enhanced Native Sharing**:
   - **Implemented proper native Android share menu**
   - Share button now opens native app selector (WhatsApp, SMS, Email, etc.)
   - Users can share lists directly to any installed app
   - Fallback to clipboard copy if native sharing unavailable

3. **Improved APK Detection**:
   - Fixed APK environment detection to be more accurate
   - Only routes to production when actually in APK (file:// protocol)
   - Prevents false positives in web browser

### 🔧 Technical Improvements
- Added CordovaDirect.shareNative() method for robust native sharing
- Enhanced share button to use native Android share dialog
- Restored all plugins that were accidentally removed in v78
- Fixed APK detection to properly identify file:// protocol

### 📦 Technical Details
- SDK 35 configuration maintained
- AndroidX libraries properly configured
- **All Cordova plugins restored including contacts plugin**
- Native social sharing plugin properly configured

### ✨ Features Working Again
- **Contact picker for SMS reminders**
- **Native Android share menu with app selector**
- Microphone recording with permission prompts
- Camera access with permission prompts
- List name editing and saving
- Share mode permissions (view/edit) for lists
- SMS authentication and verification
- AI-powered chat interface with list creation

### ⚠️ Important
- **This version restores the contacts plugin that was missing since v78**
- **Share button now uses native Android sharing like other apps**
- Users can now pick contacts from their phone for SMS reminders
- Sharing opens the standard Android share menu with all available apps

### Notes
- Production URL: https://gabai.ai
- Based on v86 with restored v70 plugins and enhanced sharing