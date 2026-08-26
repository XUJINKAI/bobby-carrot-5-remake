import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: process.env.BC5R_BASE_PATH ?? "/",
  plugins: [vue()],
  publicDir: false,
  build: {
    outDir: "dist-vite",
    emptyOutDir: true,
  },
});
