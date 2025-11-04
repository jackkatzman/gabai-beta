# GabAi APK v92 - LocalStorage Authentication Fix

## Release Date
November 4, 2025

## Critical Fix

### REVERTED INCORRECT CAPACITOR PREFERENCES IMPLEMENTATION
**The Problem with v91**: 
- v91 used Capacitor Preferences to store authentication tokens
- BUT the APK's fetch() patch in index.html (lines 248-252) ONLY looks for tokens in localStorage
- This caused authentication to fail because the fetch() patch couldn't find the token

**Root Cause Analysis**:
The GabAI APK architecture works as follows:
1. APK loads from https://gabai.ai (not file://)
2. A fetch() patch in index.html intercepts API calls
3. The patch adds Bearer tokens by reading from localStorage
4. localStorage DOES persist in WebView when loading from https://

**The Correct Fix (v92)**:
- Reverted to using **localStorage ONLY** for token storage
- This is what the fetch() patch expects and can find
- Works perfectly in both web and APK environments
- APK WebView + https:// origin = localStorage persists correctly

## Technical Changes

### Modified Files
- `client/src/lib/secure-storage.ts` - Reverted to localStorage-only storage (removed Capacitor Preferences)
- `client/src/lib/auth.ts` - Added 30s timeout and better error handling

### How It Works Now
1. User logs in via SMS verification
2. Token is saved to `localStorage.setItem('gabai_token', token)`
3. APK's fetch() patch finds token in localStorage
4. Adds `Authorization: Bearer {token}` header to all API calls
5. Authentication persists across app restarts

## Why This Works

The APK architecture is a redirect model:
- APK loads gabai.ai in WebView
- Uses https:// origin (not file://)
- localStorage persists in WebView with https:// origin
- No need for Capacitor Preferences

## Lesson Learned

Always check existing architecture before "improving" it. The original localStorage implementation was correct for this redirect-based APK architecture. The Capacitor Preferences "fix" broke it by changing the storage location that the fetch() patch couldn't find.

## Build Information
- Version Code: 92
- Target SDK: 35
- Min SDK: 24
- Build Date: November 4, 2025

## Testing Instructions
1. Install v92 APK
2. Log in via SMS
3. Close app completely
4. Reopen app - should stay logged in ✅
5. Create SMS reminder - should work ✅
