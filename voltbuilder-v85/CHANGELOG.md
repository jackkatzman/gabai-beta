# GabAi v3.0.79 - Critical Permissions & Sharing Fixes

## Release Date: September 30, 2025

### 🚨 Critical Fixes
1. **Fixed Microphone Permissions**:
   - **Added missing `cordova-plugin-android-permissions` plugin**
   - This was present in v70 but missing in v78, causing mic to fail
   - Microphone will now properly request runtime permissions on Android 6+
   - Camera permissions also fixed with runtime permission requests

2. **Fixed List Name Saving**:
   - Resolved authentication type issues preventing list name updates
   - Added proper TypeScript declarations for Express user authentication
   - List names now save correctly when edited

3. **Fixed Sharing Functionality**:
   - Corrected API endpoint inconsistency between frontend and backend
   - Changed `/api/lists/:id/share-mode` to `/api/smart-lists/:id/share-mode`
   - Share mode updates now work properly

### 🔧 Technical Improvements
- Added Express User type declarations for proper authentication
- Fixed all API endpoint consistency issues
- Improved error handling for failed operations
- Reduced TypeScript errors from 13 to 8 in server routes

### 📦 Technical Details
- SDK 35 configuration maintained
- AndroidX libraries properly configured
- **All Cordova plugins including permissions plugin now included**

### ✨ Features Working Again
- **Microphone recording with permission prompts**
- **Camera access with permission prompts**
- List name editing and saving
- Share mode permissions (view/edit) for lists
- All sharing methods with production URLs
- SMS authentication and verification
- AI-powered chat interface

### ⚠️ Important
- **This version restores the permissions plugin that was accidentally removed in v78**
- Users will be prompted to grant microphone/camera permissions when first using these features
- All list operations should now work correctly in the APK

### Notes
- Production URL: https://gabai.ai
- Based on working v70 configuration with v78 improvements