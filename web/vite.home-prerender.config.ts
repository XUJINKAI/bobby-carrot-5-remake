import { defineConfig, mergeConfig } from "vite";
import { createWebViteConfig } from "./vite.config.js";

export default mergeConfig(createWebViteConfig("build"), defineConfig({
  build: {
    ssr: "src/pages/home/prerenderHome.ts",
    outDir: "../tmp/home-prerender",
    manifest: false,
    rollupOptions: {
      output: { entryFileNames: "home.mjs" },
    },
  },
}));
