import fs from "node:fs";
import path from "node:path";
import { root } from "./util.mjs";

const file = path.join(root, "tools/scripts/verify.mjs");
let source = fs.readFileSync(file, "utf8");

const replacements = [
  [
    "/createAdventureRuntime\\(plan,game\\)/",
    "/createAdventureRuntime\\(plan\\s*,\\s*game\\)/",
  ],
  [
    "/type:'object-interaction',objectType:ObjectId\\.LOCK,action:'open'/",
    "/type\\s*:\\s*[\"']object-interaction[\"']\\s*,\\s*objectType\\s*:\\s*ObjectId\\.LOCK\\s*,\\s*action\\s*:\\s*[\"']open[\"']/",
  ],
  [
    "/type\\\\s*:\\\\s*[\"']open-lock[\"']/",
    "/type\\s*:\\s*[\"']open-lock[\"']/",
  ],
  [
    "/type:'open-lock'/",
    "/type\\s*:\\s*[\"']open-lock[\"']/",
  ],
  [
    "/onWorldEvent\\(listener:WorldEventListener\\)/",
    "/onWorldEvent\\(listener\\s*:\\s*WorldEventListener\\)/",
  ],
  [
    "/killPlayer\\(reason:string\\)/",
    "/killPlayer\\(reason\\s*:\\s*string\\)/",
  ],
  [
    "/event\\.type === 'object-interaction'/",
    "/event\\.type\\s*===\\s*[\"']object-interaction[\"']/",
  ],
  [
    "/event\\.type === 'complete' \\|\\| event\\.type === 'death'/",
    "/event\\.type\\s*===\\s*[\"']complete[\"']\\s*\\|\\|\\s*event\\.type\\s*===\\s*[\"']death[\"']/",
  ],
  [
    "/engine\\.killPlayer\\('Bonus Round/",
    "/engine\\.killPlayer\\(\\s*[\"']Bonus Round/",
  ],
];

for (const [before, after] of replacements) {
  source = source.replace(before, after);
}

fs.writeFileSync(file, source);
