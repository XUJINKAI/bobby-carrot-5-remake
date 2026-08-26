import fs from "node:fs";
import path from "node:path";
import { root, run, tscCommand } from "../lib/fs.mjs";
if (
  !fs.existsSync(path.join(root, "tools/original/dat/dist/index.js")) ||
  !fs.existsSync(path.join(root, "adventure/dist/index.js")) ||
  !fs.existsSync(path.join(root, "engine/dist/index.js")) ||
  !fs.existsSync(path.join(root, "editor/dist/index.js"))
)
  run(tscCommand(), [
    "-b",
    "model",
    "tools/original/dat",
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
run(tscCommand(), ["-b", "web", "--force"]);
run(process.execPath, ["--test", "web/tests/*.test.mjs"], { shell: true });
