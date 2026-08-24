import fs from "node:fs";
import path from "node:path";
import { root } from "./util.mjs";

const file = path.join(root, "tools/scripts/verify.mjs");
let source = fs.readFileSync(file, "utf8");

const replacements = new Map([
  [
    String.raw`/createAdventureRuntime\\\(plan,game\\\)/`,
    String.raw`/createAdventureRuntime\\\(plan\\s*,\\s*game\\\)/`,
  ],
  [
    String.raw`/type:'object-interaction',objectType:ObjectId\\.LOCK,action:'open'/`,
    String.raw`/type\\s*:\\s*["']object-interaction["']\\s*,\\s*objectType\\s*:\\s*ObjectId\\.LOCK\\s*,\\s*action\\s*:\\s*["']open["']/`,
  ],
  [
    String.raw`/type:'open-lock'/`,
    String.raw`/type\\s*:\\s*["']open-lock["']/`,
  ],
  [
    String.raw`/onWorldEvent\\\(listener:WorldEventListener\\\)/`,
    String.raw`/onWorldEvent\\\(listener\\s*:\\s*WorldEventListener\\\)/`,
  ],
  [
    String.raw`/killPlayer\\\(reason:string\\\)/`,
    String.raw`/killPlayer\\\(reason\\s*:\\s*string\\\)/`,
  ],
  [
    String.raw`/event\\.type === 'object-interaction'/`,
    String.raw`/event\\.type\\s*===\\s*["']object-interaction["']/`,
  ],
  [
    String.raw`/event\\.type === 'complete' \\|\\| event\\.type === 'death'/`,
    String.raw`/event\\.type\\s*===\\s*["']complete["']\\s*\\|\\|\\s*event\\.type\\s*===\\s*["']death["']/`,
  ],
  [
    String.raw`/engine\\.killPlayer\\\('Bonus Round/`,
    String.raw`/engine\\.killPlayer\\\(\\s*["']Bonus Round/`,
  ],
]);

for (const [before, after] of replacements) {
  if (source.includes(before)) {
    source = source.replace(before, after);
  }
}

fs.writeFileSync(file, source);
