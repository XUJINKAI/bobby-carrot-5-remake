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
    "tools/original/dat-tests/*.test.mjs",
    "adventure/tests/*.test.mjs",
    "engine/tests/*.test.mjs",
    "editor/tests/*.test.mjs",
  ],
  { shell: true },
);
fs.rmSync(path.join(root, "tmp/web-tests"), { recursive: true, force: true });
run(tscCommand(), ["-p", "web/tsconfig.test.json"]);
run(process.execPath, ["--test", "web/tests/*.test.mjs"], { shell: true });
