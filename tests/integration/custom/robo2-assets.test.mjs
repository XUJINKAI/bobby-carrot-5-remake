import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  ROBO2_GAMEPLAY_IMAGE_FILES,
  ROBO2_GAMEPLAY_IMAGE_IDS,
} from "../../../engine/dist/public.js";
import { ROBO2_SOURCE_FILE } from "../../../tools/custom/robo2/archive.mjs";
import { buildRobo2Art } from "../../../tools/custom/robo2/extract.mjs";

test("Robo 2 JAR 提供十张激光机关 gameplay 图片", () => {
  const art = buildRobo2Art(fs.readFileSync(ROBO2_SOURCE_FILE));

  assert.deepEqual(
    art.map(({ entry, file, width, height }) => ({
      entry,
      file,
      width,
      height,
    })),
    [
      {
        entry: "data/laserUp.png",
        file: "laserUp.png",
        width: 11,
        height: 14,
      },
      {
        entry: "data/laserRight.png",
        file: "laserRight.png",
        width: 14,
        height: 14,
      },
      {
        entry: "data/laserDown.png",
        file: "laserDown.png",
        width: 11,
        height: 14,
      },
      {
        entry: "data/laserLeft.png",
        file: "laserLeft.png",
        width: 14,
        height: 14,
      },
      {
        entry: "data/mirrorL.png",
        file: "mirrorL.png",
        width: 8,
        height: 12,
      },
      {
        entry: "data/mirrorR.png",
        file: "mirrorR.png",
        width: 8,
        height: 12,
      },
      {
        entry: "data/bombTickTick.png",
        file: "bombTickTick.png",
        width: 12,
        height: 12,
      },
      {
        entry: "data/bombExplode.png",
        file: "bombExplode.png",
        width: 14,
        height: 84,
      },
      {
        entry: "data/explosion.png",
        file: "explosion.png",
        width: 14,
        height: 72,
      },
      {
        entry: "data/stone.png",
        file: "stone.png",
        width: 10,
        height: 12,
      },
    ],
  );
  assert.equal(
    ROBO2_GAMEPLAY_IMAGE_FILES[ROBO2_GAMEPLAY_IMAGE_IDS.emitter.down],
    "laserDown.png",
  );
  assert.equal(
    ROBO2_GAMEPLAY_IMAGE_FILES[ROBO2_GAMEPLAY_IMAGE_IDS.mirror.backslash],
    "mirrorL.png",
  );
  assert.equal(
    ROBO2_GAMEPLAY_IMAGE_FILES[ROBO2_GAMEPLAY_IMAGE_IDS.mirror.slash],
    "mirrorR.png",
  );
  assert.equal(
    ROBO2_GAMEPLAY_IMAGE_FILES[ROBO2_GAMEPLAY_IMAGE_IDS.bomb],
    "bombTickTick.png",
  );
  assert.equal(
    ROBO2_GAMEPLAY_IMAGE_FILES[ROBO2_GAMEPLAY_IMAGE_IDS.bombExplosion],
    "bombExplode.png",
  );
  assert.equal(
    ROBO2_GAMEPLAY_IMAGE_FILES[ROBO2_GAMEPLAY_IMAGE_IDS.explosion],
    "explosion.png",
  );
  assert.equal(
    ROBO2_GAMEPLAY_IMAGE_FILES[ROBO2_GAMEPLAY_IMAGE_IDS.stone],
    "stone.png",
  );
});
