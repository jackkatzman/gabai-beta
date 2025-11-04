# GabAi APK v93 - Critical Authentication Fix

## Release Date
November 4, 2025

## Critical Bug Fix

### ROOT CAUSE IDENTIFIED
**The Problem**: v92 authentication was failing because the `auth.ts` api() function used `credentials: 'include'`, which conflicted with the APK's fetch() patch that requires `credentials: 'omit'`.

**What Was Happening**:
1. User enters SMS code
2. Server returns authentication token
3. Token is saved to localStorage ✅
4. App tries to call `/api/auth/user` to confirm authentication
5. **BUG**: The auth.ts api() function sent `credentials: 'include'` which conflicts with the fetch() patch's `credentials: 'omit'`
6. Request times out or fails
7. User sees "code accepted but authentication times out"

### The Fix (v93)

**File: `client/src/lib/auth.ts`**
- Changed `credentials` setting to be environment-aware:
  - APK: Uses `credentials: 'omit'` (matches fetch() patch expectations)
  - Web: Uses `credentials: 'include'` (for cookie-based sessions)

**File: `client/src/pages/phone-verification.tsx`**
- Added 100ms delay after saving token to localStorage
- Ensures fetch() patch can read the token before making /api/auth/user call
- Improved logging for better debugging

**File: `client/src/lib/secure-storage.ts`**
- Kept localStorage-only implementation (correct for redirect architecture)
- Removed Capacitor Preferences (not needed for this architecture)

## Technical Details

### How APK Authentication Works Now
1. User enters phone number → SMS code sent
2. User enters code → `/api/sms/verify-code` called
3. Server validates code and returns JWT token
4. Token saved to `localStorage.setItem('gabai_token', token)`
5. **100ms delay** to ensure localStorage is flushed
6. App calls `/api/auth/user` to confirm authentication
7. fetch() patch in index.html intercepts the call:
   - Reads token from localStorage ✅
   - Adds `Authorization: Bearer {token}` header ✅
   - Uses `credentials: 'omit'` ✅
8. Server receives Bearer token, authenticates user ✅
9. User successfully logged in and can access app ✅

### Key Architecture Points
- APK loads from https://gabai.ai (not file://)
- localStorage persists in WebView with https:// origin
- fetch() patch in index.html handles ALL API calls
- All API client code must use `credentials: 'omit'` in APK

## Build Information
- Version Code: 93
- Target SDK: 35
- Min SDK: 24
- Build Date: November 4, 2025

## Testing Checklist
- [ ] Install v93 APK
- [ ] Log in via SMS verification
- [ ] Verify login completes without timeout
- [ ] Close app completely
- [ ] Reopen app - should stay logged in
- [ ] Create a reminder - should work
- [ ] Send SMS reminder - should work

## Expected Behavior
- SMS code arrives within seconds
- Entering code immediately logs user in (no timeout)
- App remembers login after restart
- All features work normally
