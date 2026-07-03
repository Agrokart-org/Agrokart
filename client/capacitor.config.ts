import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agrokart.app',
  appName: 'Agrokart',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    hostname: 'fertilizer-89e57.firebaseapp.com', // Matches Firebase Auth Domain
    cleartext: true,
    allowNavigation: [
      '10.81.145.226:5000',
      '*'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#4CAF50",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#FFFFFF"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#4CAF50",
      sound: "beep.wav"
    },
    Camera: {
      saveToGallery: true
    },
    Geolocation: {
      permissions: ["location"]
    },
    App: {
      launchUrl: "com.agrokart.app"
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true
    }
  }
};

export default config;
