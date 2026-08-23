import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractZip } from './zip.mjs';
import { RELEASES } from './source-definitions.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

for (const release of RELEASES) {
  const jarPath = path.join(root, 'assets/original/official-hd', release.jar);
  if (!fs.existsSync(jarPath)) throw new Error(`缺少原始高清 JAR：${jarPath}`);
  const outputDir = path.join(root, 'assets/extracted', release.id);
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  extractZip(jarPath, outputDir);
  console.log(`解包 ${release.id} -> assets/extracted/${release.id}`);
}
