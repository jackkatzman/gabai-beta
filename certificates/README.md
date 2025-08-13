# Certificates Directory

This directory contains signing certificates for mobile app builds.

## For Android APK Signing

### Generate Android Keystore
```bash
keytool -genkey -v -keystore android.keystore -alias gabai-key -keyalg RSA -keysize 2048 -validity 10000
```

### Required Information
- **Keystore Password**: Keep secure
- **Key Alias**: gabai-key (or your chosen alias)
- **Key Password**: Keep secure
- **Organization Info**: Your organization details

### Update voltbuilder.json
After generating the keystore, update the certificate fields in `voltbuilder.json`:
```json
{
  "certificate": "certificates/android.keystore",
  "keystorePassword": "your-secure-password",
  "keyAlias": "gabai-key",
  "keyPassword": "your-key-password"
}
```

## Security Notes
- **Never commit certificates to git** (already in .gitignore)
- Store passwords securely 
- Use different passwords for keystore and key
- Keep backup of keystore file safely stored

## VoltBuilder Process
1. Create certificates using above commands
2. Update voltbuilder.json with certificate details
3. Zip entire project (including certificates directory)
4. Upload to VoltBuilder
5. Download signed APK