import fs from "node:fs";
import path from "node:path";
import { root, run, tscCommand } from "../lib/fs.mjs";
if (
  !fs.existsSync(path.join(root, "adventure/dist/index.js")) ||
  !fs.existsSync(path.join(root, "engine/dist/index.js")) ||
  !fs.existsSync(path.join(root, "editor/dist/index.js"))
)
  run(tscCommand(), [
    "-b",
    "model",
    "adventure",
    "engine",
    "editor",
    "--force",
  ]);
run(
  process.execPath,
  [
    "--test",
    "tools/custom/*.test.mjs",
    "tools/original/dat-tests/*.test.mjs",
    "adventure/tests/*.test.mjs",
    "engine/tests/*.test.mjs",
    "editor/tests/*.test.mjs",
  ],
  { shell: true },
);
// Web tests 由 Vitest 通过 Vite 直接加载 TypeScript 源码，不生成 tmp/web-tests。
run(
  "npm",
  [
    "exec",
    "--yes",
    "--package=vitest@4.1.11",
    "--",
    "vitest",
    "run",
    "--root",
    "web",
  ],
  { shell: process.platform === "win32" },
);
