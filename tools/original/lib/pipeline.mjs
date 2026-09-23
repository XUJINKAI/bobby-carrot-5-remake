import { spawnSync } from "node:child_process";
import path from "node:path";
import { root } from "../../lib/fs.mjs";
import { buildOriginalAdventure } from "../adventure-catalog.mjs";
import { decodeOriginal } from "../decode.mjs";
import { extractOriginal } from "../extract.mjs";

export { buildOriginalAdventure, decodeOriginal, extractOriginal };

export function adaptOriginal({ repositoryRoot = root } = {}) {
  const script = path.join(repositoryRoot, "tools/original/adapt.mjs");
  const result = spawnSync(process.execPath, [script], {
    cwd: repositoryRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`Original Adapter 执行失败：${result.status ?? "signal"}`);
  }
}
