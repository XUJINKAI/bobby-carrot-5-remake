import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

export const replayRoot = path.join(root, "assets/replays");

export function replayFixtureFiles() {
  return listFiles(replayRoot);
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(file) : [file];
    })
    .sort();
}
