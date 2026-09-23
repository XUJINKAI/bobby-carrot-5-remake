import fs from "node:fs";
import path from "node:path";
import { root } from "../../lib/fs.mjs";
import { readZipEntry } from "../../lib/zip-patch.mjs";
import {
  assertRobo2A1Archive,
  decodeRobo2Archive,
} from "./archive.mjs";

const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const artDefinitions = Object.freeze([
  archiveArt("data/laserUp.png", "laserUp.png", 11, 14),
  archiveArt("data/laserRight.png", "laserRight.png", 14, 14),
  archiveArt("data/laserDown.png", "laserDown.png", 11, 14),
  archiveArt("data/laserLeft.png", "laserLeft.png", 14, 14),
  overrideArt("mirrorL.png", 32, 48),
  overrideArt("mirrorR.png", 32, 48),
  archiveArt("data/bombTickTick.png", "bombTickTick.png", 12, 12),
  archiveArt("data/bombExplode.png", "bombExplode.png", 14, 84),
  archiveArt("data/explosion.png", "explosion.png", 14, 72),
  archiveArt("data/stone.png", "stone.png", 10, 12),
]);

/** 从已登记的 JAR 条目与覆盖文件构建 Engine 使用的 Robo 2 gameplay 图片。 */
export function buildRobo2Art(input) {
  const jar = Buffer.from(input);
  assertRobo2A1Archive(decodeRobo2Archive(jar));
  return artDefinitions.map(({ kind, source, file, width, height }) => {
    const content = kind === "archive"
      ? readZipEntry(jar, source)
      : fs.readFileSync(path.join(root, source));
    const dimensions = pngDimensions(content, source);
    if (dimensions.width !== width || dimensions.height !== height) {
      throw new Error(
        `${source}: 图片尺寸应为 ${width}×${height}，实际 ${dimensions.width}×${dimensions.height}`,
      );
    }
    return { source, file, content, ...dimensions };
  });
}

function archiveArt(source, file, width, height) {
  return Object.freeze({ kind: "archive", source, file, width, height });
}

function overrideArt(file, width, height) {
  return Object.freeze({
    kind: "override",
    source: `tools/custom/robo2/overrides/${file}`,
    file,
    width,
    height,
  });
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
