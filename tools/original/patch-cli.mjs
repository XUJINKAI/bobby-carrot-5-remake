import fs from "node:fs";
import path from "node:path";
import { root, run, tscCommand } from "../lib/fs.mjs";
run(tscCommand(), ["-b", "model", "--force"]);
if (!fs.existsSync(path.join(root, "tmp/assets/bc5/adapted/catalog.json"))) {
  run(process.execPath, ["tools/cli.mjs", "original", "prepare"]);
}
await import("./patch.mjs");
