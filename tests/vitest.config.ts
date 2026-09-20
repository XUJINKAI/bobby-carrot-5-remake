import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vitest/config";
import webConfig from "../web/vite.config.ts";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export default mergeConfig(
  webConfig,
  defineConfig({
    test: {
      dir: projectRoot,
      include: [
        "tests/unit/**/*.test.{mjs,ts}",
        "tests/module/**/*.test.{mjs,ts}",
        "tests/entity/**/*.test.{mjs,ts}",
        "tests/integration/**/*.test.{mjs,ts}",
      ],
    },
  }),
);
