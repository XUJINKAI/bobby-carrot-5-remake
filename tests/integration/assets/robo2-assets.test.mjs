import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  ROBO2_GAMEPLAY_IMAGE_FILES,
  ROBO2_GAMEPLAY_IMAGE_IDS,
} from "../../../engine/dist/public.js";
import { ROBO2_SOURCE_FILE } from "../../../tools/assets/robo2/archive.mjs";
import { buildRobo2Art } from "../../../tools/assets/robo2/art.mjs";

test("Robo 2 素材源提供十张激光机关 gameplay 图片", () => {
  const art = buildRobo2Art(fs.readFileSync(ROBO2_SOURCE_FILE));

  assert.deepEqual(
    art.map(({ source, file, width, height }) => ({
      source,
      file,
      width,
      height,
    })),
    [
      {
        source: "data/laserUp.png",
        file: "laserUp.png",
        width: 11,
        height: 14,
      },
      {
        source: "data/laserRight.png",
        file: "laserRight.png",
        width: 14,
        height: 14,
      },
      {
        source: "data/laserDown.png",
        file: "laserDown.png",
        width: 11,
        height: 14,
      },
      {
        source: "data/laserLeft.png",
        file: "laserLeft.png",
        width: 14,
        height: 14,
      },
      {
        source: "tools/assets/robo2/overrides/mirrorL.png",
        file: "mirrorL.png",
        width: 32,
        height: 48,
      },
      {
        source: "tools/assets/robo2/overrides/mirrorR.png",
        file: "mirrorR.png",
        width: 32,
        height: 48,
      },
      {
        source: "data/bombTickTick.png",
        file: "bombTickTick.png",
        width: 12,
        height: 12,
      },
      {
        source: "data/bombExplode.png",
        file: "bombExplode.png",
        width: 14,
        height: 84,
      },
      {
        source: "data/explosion.png",
        file: "explosion.png",
        width: 14,
        height: 72,
      },
      {
        source: "data/stone.png",
        file: "stone.png",
        width: 10,
        height: 12,
      },
    ],
  );
  for (const file of ["mirrorL.png", "mirrorR.png"]) {
    const override = fs.readFileSync(
      new URL(`../../../tools/assets/robo2/overrides/${file}`, import.meta.url),
    );
    assert.ok(art.find((asset) => asset.file === file)?.content.equals(override));
  }
  assert.equal(
    ROBO2_GAMEPLAY_IMAGE_FILES[ROBO2_GAMEPLAY_IMAGE_IDS.cannon.down],
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
