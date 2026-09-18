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
      entry: {
        index: path.join(root, "src/index.ts"),
        catalogStore: path.join(root, "src/catalogStore.ts"),
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
  },
});
