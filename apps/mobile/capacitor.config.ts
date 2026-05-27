import type { CapacitorConfig } from "@capacitor/cli";

const posUrl = "https://pos.kash.ma/auth";

const config: CapacitorConfig = {
  appId: "ma.kash.pos",
  appName: "Kash POS",
  webDir: "dist",
  server: {
    url: posUrl,
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0f172a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0f172a",
      overlaysWebView: true,
    },
    Camera: {
      permissions: ["camera", "photos"],
    },
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    backgroundColor: "#0f172a",
    allowsLinkPreview: false,
  },
  android: {
    backgroundColor: "#0f172a",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
