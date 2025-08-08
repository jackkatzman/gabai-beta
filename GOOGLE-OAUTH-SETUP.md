# Google OAuth Configuration for GabAi

## Required Redirect URIs (Copy Exactly)

Add these EXACT URLs to your Google Cloud Console OAuth 2.0 Client ID:

```
https://gabai.ai/api/auth/google/callback
https://399006af-98ce-4004-809a-fd955a60de01-00-11d3bac8de4bw.worf.replit.dev/api/auth/google/callback
```

## Important Notes

- **No spaces allowed** in redirect URIs
- **Copy each URL exactly** - no extra characters
- **One URL per line** in Google Console
- **Both URLs required** for production and development

## Google Console Steps

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. In "Authorized redirect URIs" section:
   - Click "ADD URI"
   - Paste: `https://gabai.ai/api/auth/google/callback`
   - Click "ADD URI" again
   - Paste: `https://399006af-98ce-4004-809a-fd955a60de01-00-11d3bac8de4bw.worf.replit.dev/api/auth/google/callback`
4. Click "SAVE"
5. Wait 2-5 minutes for changes to propagate

## Testing

- **Production**: Test login at https://gabai.ai
- **Development**: Test login on Replit development environment

## Current Status

Your code is already updated to automatically:
- Use `gabai.ai` callback URL in production
- Use Replit domain callback URL in development
- Detect environment automatically