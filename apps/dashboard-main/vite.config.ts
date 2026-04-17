import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    mode === "analyze" &&
      visualizer({
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      // Internal alias for in-app imports (components, assets)
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Bundle budget per phase 6 prompt: 400 KB initial gzipped
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "data-viz": ["recharts"],
          "leaflet": ["leaflet", "react-leaflet"],
        },
      },
    },
  },
}));