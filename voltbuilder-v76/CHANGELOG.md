# GabAi v3.0.76 - SDK Configuration Fix

## Release Date: September 30, 2025

### 🔧 Critical Build Fixes
1. **Android SDK Configuration**:
   - Fixed compileSdkVersion to 35 (was incorrectly set to 33 in v75)
   - Ensured targetSdkVersion matches at 35
   - Added Kotlin version pinning (1.9.24)
   - Added AndroidX version constraints to prevent conflicts

2. **Background Color Format**:
   - Fixed color format from `0xff000000` to `#FF000000`
   - Prevents "Invalid <color>" build errors

3. **Plugin Configuration**:
   - All plugins now have `source="npm"` attribute
   - Removed deprecated contacts plugin
   - Optimized plugin list for core functionality

### ✅ Retained Features from v75
- Editable shared lists with permission control
- Fixed checkbox styling (24x24px squares)
- All sharing methods with production URLs
- List name editing functionality
- SMS authentication and verification
- Camera and voice recording
- AI-powered chat interface

### 📦 Technical Details
- Build based on proven SDK 35 configuration
- Compatible with latest VoltBuilder requirements
- AndroidX libraries properly pinned to prevent conflicts
- Network security config included for dev/production

### Notes
- This build fixes the compilation errors from v75
- Uses the same successful configuration from v70-74
- Production URL: https://gabai.ai
- Ready for VoltBuilder upload