// Capacitor config - types removed to fix import error
// import type { CapacitorConfig } from '@capacitor/cli';

const config = {
  appId: 'ai.gabai.app',
  appName: 'GabAi',
  webDir: 'www',
  bundledWebRuntime: false,
  // Fix Google OAuth "disallowed_useragent" error by overriding WebView user agent
  overrideUserAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
  server: {
    url: 'https://gabai.ai',
    cleartext: false,
    allowNavigation: [
      'gabai.ai','*.gabai.ai',
      'accounts.google.com','*.googleusercontent.com','*.gstatic.com'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#3b82f6",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      overlaysWebView: true,
      backgroundColor: '#00000000'
    },
    Keyboard: {}
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    buildOptions: {
      keystorePath: '',
      keystorePassword: '',
      keystoreAlias: '',
      keystoreAliasPassword: '',
      releaseType: 'APK'
    },

  }
};

export default config;
