import {
  decodeRobo2Archive,
} from "./archive.mjs";
import { convertRobo2Level } from "./convert.mjs";

export { ROBO2_SOURCE_FILE } from "./archive.mjs";

export function buildRobo2Maps(input) {
  const archive = decodeRobo2Archive(input);

  return archive.levels.map((level) => {
    const id = String(level.index + 1).padStart(2, "0");
    return {
      id,
      document: convertRobo2Level(level, { id, title: level.title }),
    };
  });
}
