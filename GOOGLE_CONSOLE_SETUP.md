# Google Console OAuth Setup - EXACT Steps

## CRITICAL: Your Google Console still has wrong URLs

The error shows: `redirect_uri=https://gab-ai-jack741.replit.app,gabai.ai/auth/google/callback`

This means your Google Console has:
1. Multiple domains being concatenated
2. Wrong callback path (`/auth/google/callback` instead of `/api/auth/google/callback`)

## Fix Steps:

1. **Go to Google Cloud Console**
   - console.cloud.google.com
   - Select your "GabAi" project

2. **Navigate to OAuth Settings**
   - APIs & Services → Credentials
   - Click on your OAuth 2.0 Client ID

3. **DELETE ALL EXISTING REDIRECT URIs**
   - Remove every single URL in the "Authorized redirect URIs" section
   - Click the trash icon next to each one

4. **ADD THESE 3 URLS (copy exactly):**
   ```
   https://gab-ai-jack741.replit.app/api/auth/google/callback
   https://399006af-98ce-4004-809a-fd955a60de01-00-11d3bac8de4bw.worf.replit.dev/api/auth/google/callback
   http://localhost:5000/api/auth/google/callback
   ```

5. **SAVE the changes**

## What NOT to have:
- ❌ Any URL with `gabai.ai` 
- ❌ Any URL ending in `/auth/google/callback` (missing `/api`)
- ❌ Any other domains or URLs

## Current Server Configuration:
- ✅ Client ID: 963480849928-31lrn2rb8unjm83u55tjbtc52ieqffqf.apps.googleusercontent.com
- ✅ Callback URL: https://gab-ai-jack741.replit.app/api/auth/google/callback
- ✅ Server ready and waiting for correct Google Console configuration