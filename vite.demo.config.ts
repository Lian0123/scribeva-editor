import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "scribeva-editor": resolve(__dirname, "src/public-api.ts"),
      "@scribeva": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: resolve(__dirname, "demo-dist/assets"),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "demo/main.ts"),
      name: "ScribevaWebsite",
      formats: ["iife"],
      fileName: () => "site.js",
      cssFileName: "site",
    },
  },
});
