# Google Play Store Compliance Audit - GabAi v140
**Date:** November 25, 2024  
**Target Launch:** 2025  
**App ID:** ai.gabai.app  

---

## ✅ **COMPLIANT ITEMS**

### 1. Technical Requirements
- ✅ **Target SDK Level:** API 35 (Android 15) - Meets 2025 requirement
- ✅ **Compile SDK:** API 35 - Up to date
- ✅ **Min SDK:** API 24 - Good compatibility
- ✅ **App Bundle (AAB):** Configured in `voltbuilder.json` with `build_type: "aab"`
- ✅ **Package ID:** `ai.gabai.app` - Unique and valid

### 2. Privacy & Data
- ✅ **Privacy Policy:** Exists at `/privacy` route
- ✅ **Privacy Contact:** privacy@gabaiapp.com, (972)399-9997
- ✅ **CCPA/GDPR Notice:** Included in privacy policy
- ✅ **Password Reset:** Implemented with Postmark (15-min token expiry, single-use)

### 3. Authentication
- ✅ **Multiple Auth Methods:** Email/password, Google OAuth, SMS
- ✅ **Secure Password Storage:** bcrypt with 10 salt rounds
- ✅ **Account Deletion Endpoint:** Backend route exists (`DELETE /api/user/delete-my-account/:phoneNumber`)

---

## ⚠️ **NEEDS ATTENTION**

### 1. Account Deletion UI (CRITICAL - Google Requirement)
**Status:** Backend exists but NO user-facing UI  
**Required by:** Google Play Policy (apps with accounts must allow in-app deletion)

**Fix Required:**
```tsx
// Add to client/src/components/settings/settings-page.tsx
// Replace lines 75-81 with:

const handleDeleteAllData = async () => {
  if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) {
    return;
  }
  
  try {
    await fetch(`/api/user/delete-my-account/${user.phone}`, {
      method: 'DELETE'
    });
    toast({
      title: "Account Deleted",
      description: "Your account and all data have been permanently deleted.",
    });
    // Logout and redirect
    logout();
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to delete account. Please contact support.",
      variant: "destructive",
    });
  }
};
```

### 2. Privacy Policy Link in App (CRITICAL)
**Status:** Privacy page exists but no in-app link  
**Required by:** Google Play Policy

**Fix Required:**
```tsx
// Add to settings page:
<Button variant="ghost" onClick={() => setLocation('/privacy')}>
  <Shield className="h-4 w-4 mr-2" />
  Privacy Policy
</Button>
```

### 3. Google Play Billing (CRITICAL for Paid App)
**Status:** Trial/subscription system exists but uses custom backend logic  
**Required by:** Google Play Policy (all digital subscriptions MUST use Play Billing)

**Current Issue:**
- App has $9.99/month premium groups feature
- Currently uses `subscriptionStatus` field in DB
- NO Google Play Billing integration

**Fix Required:**
1. Install Google Play Billing library
2. Create in-app products in Play Console:
   - Product ID: `premium_monthly`
   - Price: $9.99/month
3. Implement billing flow:
   ```xml
   <!-- Add to config.xml -->
   <plugin name="cordova-plugin-purchase" source="npm" />
   ```
4. Replace trial logic with Play Billing subscription verification

**Alternative:** Remove subscription feature for initial launch, add later

---

## 📋 **PLAY CONSOLE REQUIREMENTS**

### 4. Data Safety Form (REQUIRED)
**Status:** Must be completed in Play Console  
**Data Collection to Declare:**

| Data Type | Collected | Purpose | Required/Optional |
|-----------|-----------|---------|-------------------|
| Name | ✅ Yes | Account creation | Required |
| Email | ✅ Yes | Authentication, password reset | Optional |
| Phone | ✅ Yes | SMS auth, reminders | Required |
| Voice recordings | ✅ Yes | AI processing | Required |
| Calendar events | ✅ Yes | Reminder functionality | Optional |
| Contacts | ✅ Yes | OCR scanning, groups | Optional |
| Location | ✅ Yes | Personalization | Optional |
| Age, profession | ✅ Yes | Personalization | Optional |

**Third-Party Data Sharing:**
- **OpenAI:** Voice transcription & AI responses (necessary for functionality)
- **Twilio:** SMS verification & reminders (necessary for functionality)
- **Google OAuth:** Optional authentication (user choice)
- **Postmark:** Password reset emails (necessary for functionality)

**Security Practices:**
- ✅ Data encrypted in transit (HTTPS)
- ✅ Password hashing (bcrypt)
- ⚠️ Add: Data encrypted at rest (if applicable)

### 5. Content Rating
**Status:** Must complete IARC questionnaire  
**Recommended Rating:** Teen (13+) or Everyone

**Questions to Answer:**
- Violence: None
- Sexual content: None
- Profanity: Possible (AI may generate mild language)
- Gambling: None
- Controlled substances: None
- Mature themes: None

### 6. Store Listing Requirements

**Missing:**
- [ ] App icon (1024x1024 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (minimum 2, max 8)
  - Phone: 320-3840px on shortest side
  - Recommend: 1080x1920 (portrait)
- [ ] Short description (max 80 chars)
- [ ] Full description (max 4000 chars)
- [ ] Privacy policy URL: https://gabai.ai/privacy

**Suggested Short Description:**
"Voice-first AI assistant for ADHD-friendly task management and smart reminders"

---

## 🔐 **PERMISSIONS AUDIT**

### Current Permissions (from config.xml):
```xml
✅ INTERNET - Required for API calls
✅ ACCESS_NETWORK_STATE - Check connectivity
⚠️ CAMERA - Needs justification: "Scan business cards and documents"
⚠️ RECORD_AUDIO - Needs justification: "Voice commands and AI conversations"
⚠️ READ/WRITE_EXTERNAL_STORAGE - Consider removing for SDK 35
⚠️ READ/WRITE_CONTACTS - Needs justification: "Save and manage contacts from scans"
✅ VIBRATE - Haptic feedback
✅ POST_NOTIFICATIONS - Reminders
✅ SCHEDULE_EXACT_ALARM - Precise reminder timing
```

**Recommendations:**
1. Remove `READ/WRITE_EXTERNAL_STORAGE` (deprecated in API 33+)
2. Add permission explanations in Play Console
3. Request permissions at runtime with clear rationale

---

## 🎯 **ACTION ITEMS - PRIORITY ORDER**

### CRITICAL (Must fix before submission)
1. ✅ **Account Deletion UI** - Add button in settings
2. ✅ **Privacy Policy Link** - Add to settings & login screen
3. ⚠️ **Google Play Billing** - Either implement or remove subscription feature
4. ⚠️ **Data Safety Form** - Complete in Play Console
5. ⚠️ **Content Rating** - Complete IARC questionnaire

### HIGH (Needed for approval)
6. ⚠️ **Store Assets** - Screenshots, icon, graphics
7. ⚠️ **App Description** - Write compelling listing
8. ⚠️ **Permission Justifications** - Document in Play Console

### MEDIUM (Best practices)
9. ⚠️ **Remove deprecated permissions** - Clean up storage permissions
10. ⚠️ **Privacy policy URL** - Ensure https://gabai.ai/privacy is publicly accessible
11. ⚠️ **Test account** - Provide for Google review team

---

## 📝 **RECOMMENDED NEXT STEPS**

### Option A: Quick Launch (No Subscription)
1. Remove subscription/groups feature temporarily
2. Add account deletion UI
3. Add privacy policy links
4. Complete Data Safety form
5. Submit for review
6. Add subscription in future update with Play Billing

### Option B: Full Launch (With Subscription)
1. Implement Google Play Billing
2. Add account deletion UI
3. Add privacy policy links
4. Complete Data Safety form
5. Test subscription flow thoroughly
6. Submit for review

**Estimated Time:**
- Option A: 2-4 hours
- Option B: 1-2 days

---

## 🔍 **TESTING CHECKLIST**

Before submission:
- [ ] Test account deletion (full data removal)
- [ ] Verify privacy policy loads in-app
- [ ] Test all permissions (camera, mic, contacts)
- [ ] Verify app works offline (where applicable)
- [ ] Check no crashes on startup
- [ ] Test on Android 15 device
- [ ] Verify back button works correctly
- [ ] Test subscription flow (if keeping)

---

## 📧 **SUPPORT CONTACTS**

**Current:**
- privacy@gabaiapp.com
- (972)399-9997

**Recommendations:**
- Add support@gabai.ai
- Create privacy policy at https://gabai.ai/privacy (currently only in-app)

---

## ✅ **SUMMARY**

**Ready for submission:** 70%

**Must fix:**
1. Account deletion UI (15 min)
2. Privacy policy link (5 min)
3. Data Safety form (30 min)
4. Google Play Billing OR remove subscription (2 hours OR 15 min)

**Total time to compliance:** 1-3 hours (depending on billing decision)
