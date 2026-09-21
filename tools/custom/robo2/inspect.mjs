import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodeRobo2Archive,
  ROBO2_A1_SHA256,
} from "./archive.mjs";

export function inspectRobo2Jar(jarPath) {
  const archive = decodeRobo2Archive(fs.readFileSync(jarPath));
  return {
    ...archive,
    expectedSha256: ROBO2_A1_SHA256,
    matchesExpectedArchive: archive.sha256 === ROBO2_A1_SHA256,
  };
}

function main() {
  const jarPath = process.argv[2];
  if (!jarPath) {
    throw new Error("用法：node tools/custom/robo2/inspect.mjs <robo2.jar>");
  }
  const result = inspectRobo2Jar(path.resolve(jarPath));
  console.log(JSON.stringify(result, null, 2));
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
