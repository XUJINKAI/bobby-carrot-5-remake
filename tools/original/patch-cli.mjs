import fs from "node:fs";
import path from "node:path";
import { root, run, tscCommand } from "../lib/fs.mjs";
run(tscCommand(), ["-b", "model", "tools/original/dat", "--force"]);
if (!fs.existsSync(path.join(root, "original/adapted/catalog.json"))) {
  run(process.execPath, ["tools/cli.mjs", "original", "prepare"]);
}
await import("./patch.mjs");
