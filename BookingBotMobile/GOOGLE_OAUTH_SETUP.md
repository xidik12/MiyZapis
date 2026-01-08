# Google OAuth Setup Guide for Mobile App

## Prerequisites
1. Google Cloud Console account
2. Expo development build (not Expo Go - OAuth requires native configuration)

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable **Google+ API** (or **Google Identity Services**)
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen if prompted

## Step 2: Configure OAuth Client IDs

### For iOS:
1. Application type: **iOS**
2. Bundle ID: `com.panhaha.bookingbot` (from your app.json)
3. Save the **Client ID** (it will look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

### For Android:
1. Application type: **Android**
2. Package name: `com.panhaha.bookingbot` (from your app.json)
3. SHA-1 certificate fingerprint: Get this by running:
   ```bash
   cd ios
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
4. Save the **Client ID**

### For Web (if needed):
1. Application type: **Web application**
2. Authorized redirect URIs:
   - `panhaha://oauth` (for deep linking)
   - `exp://localhost:8081/--/oauth` (for development)
   - Your production redirect URI

## Step 3: Update app.json

Add your Google Client IDs to `app.json`:

```json
{
  "expo": {
    "extra": {
      "googleClientId": "YOUR_IOS_CLIENT_ID_HERE",
      "googleClientIdAndroid": "YOUR_ANDROID_CLIENT_ID_HERE"
    },
    "ios": {
      "bundleIdentifier": "com.panhaha.bookingbot",
      "googleServicesFile": "./GoogleService-Info.plist" // If using Firebase
    },
    "android": {
      "package": "com.panhaha.bookingbot",
      "googleServicesFile": "./google-services.json" // If using Firebase
    },
    "scheme": "panhaha"
  }
}
```

## Step 4: Configure Deep Linking

The app is already configured with scheme `panhaha` in `app.json`. This allows OAuth redirects to work.

## Step 5: Update Environment Config

The `environment.ts` file will automatically read the `googleClientId` from `app.json` via `expo-constants`.

## Step 6: Rebuild the App

After updating `app.json`, you need to rebuild:

```bash
# Clean and rebuild
cd ios
pod install
cd ..

# Rebuild native project
npx expo prebuild --clean

# Build in Xcode
open ios/Panhaha.xcworkspace
```

## Step 7: Test Google Sign-In

1. Build and run the app on a physical device or simulator
2. Tap "Continue with Google" button
3. Complete the OAuth flow
4. Verify authentication works

## Troubleshooting

### "Redirect URI mismatch" error
- Ensure the redirect URI in Google Cloud Console matches: `panhaha://oauth`
- For development: `exp://localhost:8081/--/oauth`

### "Client ID not found" error
- Verify `googleClientId` is set in `app.json` → `extra`
- Rebuild the app after changing `app.json`

### OAuth flow doesn't open browser
- Ensure you're using a development build, not Expo Go
- Check that `scheme` is set in `app.json`
- Verify deep linking is configured in iOS/Android settings

### "Invalid client" error
- Double-check the Client ID is correct
- Ensure the Client ID matches the platform (iOS vs Android)
- Verify the bundle ID/package name matches exactly

## Notes

- **Expo Go doesn't support OAuth** - You must use a development build
- The OAuth flow uses **ID Token** (not access token) which is sent to your backend
- Your backend should verify the ID token with Google's servers
- The redirect URI scheme (`panhaha://`) must match what's configured in Google Cloud Console

## Security Best Practices

1. Never commit Client IDs to version control (use environment variables)
2. Use different Client IDs for development and production
3. Restrict OAuth consent screen to authorized test users during development
4. Regularly rotate OAuth credentials
5. Monitor OAuth usage in Google Cloud Console

