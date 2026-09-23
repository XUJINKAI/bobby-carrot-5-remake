import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serializeMapDocument } from "@bobby/model";
import { root } from "../../lib/fs.mjs";
import {
  assertRobo2A1Archive,
  decodeRobo2Archive,
  ROBO2_SOURCE_FILE,
} from "./archive.mjs";
import { convertRobo2Level } from "./convert.mjs";

const outputDirectory = path.join(root, "custom-maps/robo2");
export { ROBO2_SOURCE_FILE } from "./archive.mjs";

export function buildRobo2Maps(input) {
  const archive = assertRobo2A1Archive(decodeRobo2Archive(input));

  return archive.levels.map((level) => {
    const id = String(level.index + 1).padStart(2, "0");
    return {
      id,
      document: convertRobo2Level(level, { id, title: level.title }),
    };
  });
}

export function writeRobo2Maps(input) {
  const maps = buildRobo2Maps(input);
  fs.rmSync(outputDirectory, { recursive: true, force: true });
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const map of maps) {
    fs.writeFileSync(
      path.join(outputDirectory, `${map.id}.json`),
      serializeMapDocument(map.document),
    );
  }
  return maps;
}

function isMainModule() {
  return process.argv[1] &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  const source = process.argv[2]
    ? path.resolve(process.argv[2])
    : ROBO2_SOURCE_FILE;
  const maps = writeRobo2Maps(fs.readFileSync(source));
  console.log(`构建 Robo 2：${maps.length} 张地图。`);
}
