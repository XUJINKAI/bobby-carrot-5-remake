import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

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

export function assertRobo2A1Source(input) {
  if (!(input instanceof Uint8Array)) {
    throw new TypeError("Robo 2 JAR 必须是 Uint8Array");
  }
  const sha256 = crypto
    .createHash("sha256")
    .update(input)
    .digest("hex");
  if (sha256 !== ROBO2_A1_SHA256) {
    throw new Error(
      `Robo 2 JAR SHA-256 不匹配：应为 ${ROBO2_A1_SHA256}，实际 ${sha256}`,
    );
  }
  return { sha256 };
}
