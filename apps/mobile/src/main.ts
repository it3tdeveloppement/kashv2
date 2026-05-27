import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Device } from "@capacitor/device";
import { Geolocation } from "@capacitor/geolocation";
import { Keyboard } from "@capacitor/keyboard";
import { Preferences } from "@capacitor/preferences";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import "./styles.css";

const posUrl = "https://pos.kash.ma/auth";
const app = document.querySelector<HTMLDivElement>("#app");

async function bootstrapNativeBridge() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  await Promise.allSettled([
    StatusBar.setStyle({ style: Style.Dark }),
    StatusBar.setBackgroundColor({ color: "#0f172a" }),
    SplashScreen.hide(),
    Preferences.set({ key: "last_boot_url", value: posUrl }),
  ]);

  Keyboard.addListener("keyboardWillShow", () => document.body.classList.add("keyboard-open"));
  Keyboard.addListener("keyboardWillHide", () => document.body.classList.remove("keyboard-open"));

  App.addListener("appUrlOpen", (event) => {
    if (event.url.startsWith("kashpos://")) {
      window.location.href = posUrl;
    }
  });
}

async function requestCameraCheck() {
  try {
    await Camera.requestPermissions({ permissions: ["camera", "photos"] });
    await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });
  } catch {
    // The user can deny this during preview; store builds still include native permissions.
  }
}

async function requestLocationCheck() {
  try {
    await Geolocation.requestPermissions();
    await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
  } catch {
    // Optional capability check only.
  }
}

async function renderFallbackShell() {
  const info = await Device.getInfo().catch(() => undefined);

  if (!app) {
    return;
  }

  app.innerHTML = `
    <section class="shell">
      <div class="brand">
        <span class="mark">K</span>
        <div>
          <p>Kash POS</p>
          <strong>Mobile container</strong>
        </div>
      </div>
      <div class="panel">
        <p class="label">Remote POS</p>
        <h1>https://pos.kash.ma/auth</h1>
        <p class="copy">
          Native Android and iOS builds load the secure Kash POS URL directly through Capacitor.
          This local screen stays available for web preview, diagnostics, and fallback builds.
        </p>
        <div class="actions">
          <a class="primary" href="${posUrl}">Open POS</a>
          <button id="camera-check" type="button">Test camera</button>
          <button id="location-check" type="button">Test location</button>
        </div>
      </div>
      <dl class="meta">
        <div><dt>Platform</dt><dd>${info?.platform ?? "web"}</dd></div>
        <div><dt>OS</dt><dd>${info?.operatingSystem ?? "browser"}</dd></div>
        <div><dt>Native</dt><dd>${Capacitor.isNativePlatform() ? "yes" : "no"}</dd></div>
      </dl>
    </section>
  `;

  document.querySelector("#camera-check")?.addEventListener("click", requestCameraCheck);
  document.querySelector("#location-check")?.addEventListener("click", requestLocationCheck);
}

bootstrapNativeBridge();
renderFallbackShell();
