# Kash POS Mobile

Capacitor Android/iOS container for `https://pos.kash.ma/auth`.

## What this app includes

- Android and iOS Capacitor targets.
- Remote HTTPS POS loading through `server.url`.
- Camera, photo library, geolocation, keyboard, status bar, splash screen, push notification, share, filesystem, browser, device, and app plugins.
- A local fallback/diagnostic screen for browser preview and native troubleshooting.

## Commands

```bash
pnpm --filter @kash/mobile build
pnpm --filter @kash/mobile cap:sync
pnpm --filter @kash/mobile android
pnpm --filter @kash/mobile ios
```

Android builds require Android Studio or a configured Android SDK:

```bash
$env:ANDROID_HOME="C:\Users\<you>\AppData\Local\Android\Sdk"
```

You can also create `android/local.properties` with:

```properties
sdk.dir=C:\\Users\\<you>\\AppData\\Local\\Android\\Sdk
```

The iOS project must be built and archived on macOS with Xcode. On the Mac, run CocoaPods install through Capacitor sync:

```bash
pnpm --filter @kash/mobile cap:sync
pnpm --filter @kash/mobile ios
```

## Store notes

Apple and Google are more likely to approve the app when it provides native value beyond a basic website wrapper. Keep camera/barcode scanning, push notifications, printing, offline behavior, and native error handling in the app roadmap.

The remote POS web app must call Capacitor APIs when it needs plugin-powered camera flows. Plain browser APIs such as file inputs and `getUserMedia` can also work in WebView when the native permissions are present.

Before submitting:

- Replace the default Capacitor icon and splash assets with Kash production artwork.
- Configure signing in Android Studio and Xcode.
- Add Apple Developer and Google Play privacy disclosures for camera, photos, location, notifications, and any POS analytics.
- Test login, redirects, cookies, camera/barcode flows, payment flows, printing, and offline/poor-network behavior on real devices.
