import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { readZipEntry } from "../../lib/zip-patch.mjs";
import { decodeRobo2LevelRecord } from "./format.mjs";

export const ROBO2_SOURCE_FILE = fileURLToPath(
  new URL("./robo2.jar", import.meta.url),
);
export const ROBO2_A1_SHA256 =
  "089499b7d5bbd3438ec970ac4ec42ff9e71b92a79824881bb2583b608b042be3";

export const ROBO2_LEVEL_TITLES = Object.freeze([
  "The beggining!",
  "Some mirrors",
  "Dark forest",
  "Voodoo people",
  "Forest maze",
  "Green Square",
  "The ruins",
  "Rock to power",
  "Mirror puzzle",
  "Alarm system",
  "Ammunition",
  "Our office",
  "The Iceland",
  "Bomb trap",
  "Dragon&Dracula",
  "Icy lawn",
  "Ice alley",
  "Snowflake",
  "The Space Base",
  "Rocks&Rockets",
  "Laser field",
  "Long way",
  "Think twice",
  "Almost win",
  "Saving Eny!",
]);

/** 解码已确认的 25 关 a1 JAR；archive provenance 不进入 LevelMap。 */
export function decodeRobo2Archive(input) {
  if (!(input instanceof Uint8Array)) {
    throw new TypeError("Robo 2 JAR 必须是 Uint8Array");
  }
  const jar = Buffer.from(input);
  const sha256 = crypto.createHash("sha256").update(jar).digest("hex");
  const levels = ROBO2_LEVEL_TITLES.map((title, index) => ({
    index,
    title,
    ...decodeRobo2LevelRecord(
      readZipEntry(jar, `data/${index}`),
      `data/${index}`,
    ),
  }));
  return { sha256, levels };
}
