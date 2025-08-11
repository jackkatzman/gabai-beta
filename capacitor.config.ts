// Capacitor config - types removed to fix import error
// import type { CapacitorConfig } from '@capacitor/cli';

const config = {
  appId: 'ai.gabai.app',
  appName: 'GabAi',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#3b82f6",
      showSpinner: true,
      spinnerColor: "#ffffff"
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
