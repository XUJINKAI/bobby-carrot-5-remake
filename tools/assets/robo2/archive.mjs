import { readZipEntry } from "../../lib/zip-patch.mjs";
import { decodeRobo2LevelRecord } from "./format.mjs";
import {
  assertRobo2A1Source,
  ROBO2_LEVEL_TITLES,
} from "./source.mjs";

export {
  ROBO2_A1_SHA256,
  ROBO2_LEVEL_TITLES,
  ROBO2_SOURCE_FILE,
} from "./source.mjs";

/** 解码已确认的 25 关 a1 JAR；archive provenance 不进入 LevelMap。 */
export function decodeRobo2Archive(input) {
  const jar = Buffer.from(input);
  const { sha256 } = assertRobo2A1Source(jar);
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
