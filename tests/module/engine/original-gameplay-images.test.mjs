import assert from "node:assert/strict";
import test from "node:test";
import {
  createOriginalGameplayImageManager,
  ORIGINAL_GAMEPLAY_HUD_SLICE_IDS,
  ORIGINAL_GAMEPLAY_IMAGE_FILES,
  ORIGINAL_GAMEPLAY_IMAGE_IDS,
} from "../../../engine/dist/public.js";

test("原版 Gameplay 图片工厂提供完整语义资源合同", () => {
  const images = createOriginalGameplayImageManager(
    (file) => `/assets/art/hd/${file}`,
  );

  assert.deepEqual(
    images.sourceIds,
    Object.keys(ORIGINAL_GAMEPLAY_IMAGE_FILES),
  );
  for (const [id, file] of Object.entries(ORIGINAL_GAMEPLAY_IMAGE_FILES))
    assert.equal(images.source(id), `/assets/art/hd/${file}`);

  assert.equal(
    ORIGINAL_GAMEPLAY_IMAGE_FILES[ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.snowplow],
    "b8.png",
  );
  assert.equal(
    ORIGINAL_GAMEPLAY_IMAGE_FILES[ORIGINAL_GAMEPLAY_IMAGE_IDS.bobby.speedTrail],
    "mow.png",
  );
  assert.equal(
    ORIGINAL_GAMEPLAY_IMAGE_FILES[ORIGINAL_GAMEPLAY_IMAGE_IDS.dragonFireball],
    "hud.png",
  );
  assert.equal(
    ORIGINAL_GAMEPLAY_IMAGE_FILES[ORIGINAL_GAMEPLAY_IMAGE_IDS.ambientButterfly],
    "bf.png",
  );

  for (const sliceId of Object.values(ORIGINAL_GAMEPLAY_HUD_SLICE_IDS))
    assert.equal(
      images.sliceDefinition(sliceId).source,
      ORIGINAL_GAMEPLAY_IMAGE_IDS.hudAtlas,
    );
});
