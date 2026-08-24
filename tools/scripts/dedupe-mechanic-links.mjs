import fs from "node:fs";
import path from "node:path";
import { root } from "./util.mjs";

const file = path.join(root, "engine/src/mechanics/definitions.ts");
let source = fs.readFileSync(file, "utf8");

const startMarker = "const TIDE_DIRECTION =";
const endMarker = "export function reflectFireForTerrain";
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start >= 0 && end >= 0) {
  source = source.slice(0, start) + source.slice(end);
}

const exportBlock = [
  'export {',
  '  cloudGridForObject,',
  '  tideDirectionForTerrain,',
  '  windmillInfoForObject,',
  '  windSwitchIndexForTerrain,',
  '  windSwitchPeerForTerrain,',
  '} from "./mechanic-links.js";',
  '',
].join("\n");

if (!source.includes("tideDirectionForTerrain,")) {
  const anchor = 'export type {\n';
  const index = source.indexOf(anchor);
  if (index < 0) throw new Error("找不到 definitions.ts 的导出区");
  source = source.slice(0, index) + exportBlock + source.slice(index);
}

fs.writeFileSync(file, source);
