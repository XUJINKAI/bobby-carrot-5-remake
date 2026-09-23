import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractZip } from "../../lib/zip.mjs";
import { RELEASES } from "./source-definitions.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");

export function extractOriginal({
  repositoryRoot = root,
  outputRoot = path.join(repositoryRoot, "tmp/assets/bc5/extracted"),
} = {}) {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  for (const release of RELEASES) {
    const jarPath = path.join(
      repositoryRoot,
      "original/official-hd",
      release.jar,
    );
    if (!fs.existsSync(jarPath)) {
      throw new Error(`缺少原始高清 JAR：${jarPath}`);
    }
    const outputDirectory = path.join(outputRoot, release.id);
    fs.mkdirSync(outputDirectory, { recursive: true });
    extractZip(jarPath, outputDirectory);
    console.log(`解包 ${release.id} -> ${relative(repositoryRoot, outputDirectory)}`);
  }
}

function relative(repositoryRoot, target) {
  return path.relative(repositoryRoot, target).split(path.sep).join("/");
}
