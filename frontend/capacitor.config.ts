import type { CapacitorConfig } from '@capacitor/cli';

// Live-site wrap: the native iOS/Android app loads the production web app
// directly, so it is always pixel-identical to miyzapis.com and updates with
// every web deploy (no app-store resubmit for UI changes). Native shell adds
// splash, status bar, haptics and the Android hardware back button.
const config: CapacitorConfig = {
  appId: 'com.miyzapis.app',
  appName: 'MiyZapis',
  webDir: 'dist',
  server: {
    url: 'https://miyzapis.com',
    cleartext: false,
  },
  backgroundColor: '#ffffff',
  ios: {
    // The web app handles safe areas itself (viewport-fit=cover + env(safe-area-inset)),
    // so 'never' lets the WebView fill the screen and render exactly like mobile Safari —
    // 'always' double-inset the content and made the app look off vs the website.
    contentInset: 'never',
    backgroundColor: '#ffffff',
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#ffffffff',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK', // dark icons on the light app background
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
