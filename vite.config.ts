import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    lib: {
      entry: {
        scribeva: resolve(__dirname, "src/public-api.ts"),
        locales: resolve(__dirname, "src/locales/index.ts"),
      },
      name: "Scribeva",
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "js" : "cjs"}`,
    },
    sourcemap: true,
    minify: "esbuild",
    target: "es2020",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: (asset) =>
          asset.name?.endsWith(".css")
            ? "scribeva.css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
});
