import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 3001,
    host: true,
    headers: {
      // Required for PowerSync SharedWorker (COOP + COEP)
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    exclude: ["@powersync/web"],
  },
  worker: {
    format: "es",
  },
  build: {
    target: "esnext",
  },
});
