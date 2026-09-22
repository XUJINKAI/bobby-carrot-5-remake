import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodeRobo2Archive,
  ROBO2_A1_SHA256,
  ROBO2_SOURCE_FILE,
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
  const jarPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : ROBO2_SOURCE_FILE;
  const result = inspectRobo2Jar(jarPath);
  console.log(JSON.stringify(result, null, 2));
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
