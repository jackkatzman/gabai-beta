# GabAI APK v24 - Authentication Fix

## Version 24 Build Information
- **Date**: September 10, 2025
- **Download**: https://gabai.ai/gabai-v24.zip
- **Test Page**: https://gabai.ai/#/cordova-test
- **Size**: 5.6MB

## Critical Fix in v24: Authentication After SMS Login

### The Problem
After successful SMS authentication:
1. Token stored correctly in localStorage
2. App redirects to `#/chat`
3. Auth check fails with "Failed to fetch" error
4. User stuck on login screen despite being authenticated

### Root Cause
The fetch override was only adding Authorization headers to relative URLs starting with `/api/`, but the React code was using absolute URLs like `https://gabai.ai/api/auth/user` for APK environments.

### The Solution
Updated fetch override to:
```javascript
// Add token for any gabai.ai API call (both relative and absolute)
if (typeof url === 'string' && (url.startsWith('/api/') || url.includes('gabai.ai/api/'))) {
  // Try multiple token locations
  var token = localStorage.getItem('gabai_token') || 
             localStorage.getItem('token') || 
             sessionStorage.getItem('gabai_token');
  if (token) {
    options.headers = options.headers || {};
    options.headers['Authorization'] = 'Bearer ' + token;
    console.log('🔑 Added auth token to request:', url);
  }
}
```

## What This Fixes

1. **SMS Authentication Flow**: After SMS verification, the redirect to chat should now work
2. **Token Persistence**: Checks multiple storage locations for tokens
3. **API Compatibility**: Works with both relative (`/api/...`) and absolute (`https://gabai.ai/api/...`) URLs
4. **Session Recovery**: Should maintain authentication across app restarts

## Testing Instructions

1. **Download v24**: https://gabai.ai/gabai-v24.zip
2. **Upload to VoltBuilder**: Build the APK
3. **Install and Test**:
   - Enter phone number
   - Enter SMS code
   - Should redirect to chat and show authenticated user
   - Close and reopen app - should remain authenticated

## Previous Working Features (Still Working)
- ✅ Microphone recording and transcription
- ✅ Camera capture without double base64 prefix
- ✅ SMS code auto-fill and verification
- ✅ Local storage persistence

## Known Remaining Issues
- ⚠️ Android permissions still need manual approval
- ⚠️ Permission request UI shows ❌ (cosmetic issue)

## Technical Details

The fetch override now:
1. Converts relative URLs to absolute for APK environment
2. Adds Authorization header to ALL gabai.ai API calls
3. Checks multiple token storage locations
4. Logs token addition for debugging

This should finally resolve the authentication persistence issue that was preventing users from accessing the app after SMS login!