import { createRoot } from "react-dom/client";
import App from "./App";
import "./env";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Register the service worker. autoUpdate keeps users on the latest shell
// without requiring a manual reload prompt — important for field officers
// who can't be expected to manage app updates manually.
if ("serviceWorker" in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      // Re-check for updates every hour while the app is running
      if (registration) {
        setInterval(() => registration.update().catch(() => null), 60 * 60 * 1000);
      }
    },
    onOfflineReady() {
      console.log("[PWA] App is ready to work offline.");
    },
    onNeedRefresh() {
      console.log("[PWA] New content available; will refresh on next visit.");
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
