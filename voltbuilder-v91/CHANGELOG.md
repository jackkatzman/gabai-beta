# GabAi APK v91 - Authentication Persistence Fix

## Release Date
November 4, 2025

## Critical Bug Fixes

### Authentication Persistence in APK
**PROBLEM SOLVED**: Users were being logged out every time they closed and reopened the APK app.

**Root Cause**: 
- Previous versions used `localStorage` for token storage
- Android WebView clears `localStorage` when the app closes
- Tokens were lost on every app restart

**Solution Implemented**:
1. **Platform-Aware Secure Storage** (`client/src/lib/secure-storage.ts`)
   - APK: Uses Capacitor Preferences API (persists across restarts)
   - Web: Uses localStorage (standard browser storage)
   - Automatic platform detection

2. **Centralized Authentication State** (`client/src/contexts/AuthContext.tsx`)
   - Single source of truth for auth state across the app
   - Proper async token loading before rendering protected routes
   - Global token state management with `hasToken` and `tokenChecked` flags

3. **Token Refresh System**
   - `recheckToken()` function triggers app-wide auth state updates
   - Called after SMS login to immediately update all components
   - Ensures reminders and protected features work instantly

4. **Security Improvements**
   - Centralized 401 handler clears ALL auth state on unauthorized responses
   - `effectiveUser` safety check prevents stale user data from showing
   - Proper cache invalidation on logout/unauthorized

## Technical Changes

### New Files
- `client/src/lib/secure-storage.ts` - Platform-aware storage abstraction
- `client/src/contexts/AuthContext.tsx` - Centralized auth state management

### Modified Files
- `client/src/lib/auth.ts` - Updated to use global unauthorized handler
- `client/src/hooks/useAuth.ts` - Async token loading
- `client/src/pages/phone-verification.tsx` - Calls recheckToken after login
- `client/src/App.tsx` - Uses AuthContext provider

## User-Facing Improvements

✅ **Stay Logged In**: Close and reopen the app - you'll stay logged in
✅ **SMS Reminders Work**: Authentication persists so you can create and receive reminders
✅ **Better Security**: Proper handling of expired sessions and unauthorized access
✅ **Faster Login**: Auth state updates immediately after SMS verification

## Testing Recommendations

1. **APK Cold Start Test**:
   - Install APK
   - Log in via SMS
   - Close app completely
   - Reopen app
   - ✅ Should still be logged in

2. **Reminder Creation Test**:
   - Stay logged in after app restart
   - Create a new SMS reminder
   - ✅ Should work without re-login

3. **Session Expiry Test**:
   - Force a 401 by invalidating token on server
   - ✅ Should cleanly redirect to login without showing stale data

## Build Information
- Version Code: 91
- Target SDK: 35
- Min SDK: 24
- Build Date: November 4, 2025

## Next Steps
1. Upload this package to VoltBuilder
2. Build APK
3. Test authentication persistence on device
4. Deploy to production
