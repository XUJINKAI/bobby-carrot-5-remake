import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { markdownPlugin } from "./build/markdownPlugin.js";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  plugins: [markdownPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: path.join(root, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
  },
});
