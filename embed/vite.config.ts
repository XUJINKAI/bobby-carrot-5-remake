import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  build: {
    outDir: "../dist/embed/v1",
    emptyOutDir: false,
    lib: {
      entry: path.join(root, "src/public.ts"),
      name: "BC5R",
      formats: ["iife"],
      fileName: () => "bc5r.js",
    },
  },
});
