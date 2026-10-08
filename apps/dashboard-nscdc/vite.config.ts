import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { devApi } from "./server/devApi";

export default defineConfig({
  server: {
    host: "::",
    port: 5174,
    hmr: { overlay: false },
  },
  plugins: [react(), devApi()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "data-viz": ["recharts"],
          leaflet: ["leaflet", "react-leaflet"],
        },
      },
    },
  },
});
