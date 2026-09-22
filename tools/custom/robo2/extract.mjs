import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { root } from "../../lib/fs.mjs";
import { readZipEntry } from "../../lib/zip-patch.mjs";
import {
  assertRobo2A1Archive,
  decodeRobo2Archive,
  ROBO2_SOURCE_FILE,
} from "./archive.mjs";

const outputDirectory = path.join(root, "assets/art/robo2");
const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const artDefinitions = Object.freeze([
  art("data/laserUp.png", "laserUp.png", 11, 14),
  art("data/laserRight.png", "laserRight.png", 14, 14),
  art("data/laserDown.png", "laserDown.png", 11, 14),
  art("data/laserLeft.png", "laserLeft.png", 14, 14),
  art("data/mirrorL.png", "mirrorL.png", 8, 12),
  art("data/mirrorR.png", "mirrorR.png", 8, 12),
  art("data/bombTickTick.png", "bombTickTick.png", 12, 12),
  art("data/bombExplode.png", "bombExplode.png", 14, 84),
  art("data/explosion.png", "explosion.png", 14, 72),
  art("data/stone.png", "stone.png", 10, 12),
]);

/** 从固定来源包读取 Engine 实际使用的 Robo 2 gameplay 图片。 */
export function buildRobo2Art(input) {
  const jar = Buffer.from(input);
  assertRobo2A1Archive(decodeRobo2Archive(jar));
  return artDefinitions.map(({ entry, file, width, height }) => {
    const content = readZipEntry(jar, entry);
    const dimensions = pngDimensions(content, entry);
    if (dimensions.width !== width || dimensions.height !== height) {
      throw new Error(
        `${entry}: 图片尺寸应为 ${width}×${height}，实际 ${dimensions.width}×${dimensions.height}`,
      );
    }
    return { entry, file, content, ...dimensions };
  });
}

function art(entry, file, width, height) {
  return Object.freeze({ entry, file, width, height });
}

export function writeRobo2Art(input) {
  const art = buildRobo2Art(input);
  fs.rmSync(outputDirectory, { recursive: true, force: true });
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const asset of art) {
    fs.writeFileSync(path.join(outputDirectory, asset.file), asset.content);
  }
  return art;
}

function pngDimensions(content, source) {
  if (
    content.length < 24 ||
    !content.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE) ||
    content.subarray(12, 16).toString("ascii") !== "IHDR"
  ) {
    throw new Error(`${source}: 不是有效的 PNG`);
  }
  return {
    width: content.readUInt32BE(16),
    height: content.readUInt32BE(20),
  };
}

function isMainModule() {
  return process.argv[1] &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  const source = process.argv[2]
    ? path.resolve(process.argv[2])
    : ROBO2_SOURCE_FILE;
  const art = writeRobo2Art(fs.readFileSync(source));
  console.log(`提取 Robo 2：${art.length} 个 gameplay 图片。`);
}
