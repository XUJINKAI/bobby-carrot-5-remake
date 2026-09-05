import test from "node:test";
import assert from "node:assert/strict";
import { LegacyTerrain } from "../dat/semantic-ids.mjs";
import { decodeDatTerrain, encodeDatTerrain } from "../dat/mapping.mjs";

test("DAT Carousel Switch bytes preserve confirmed pressed and raised states", () => {
  assert.equal(decodeDatTerrain(0xa3), LegacyTerrain.CAROUSEL_SWITCH_PRESSED);
  assert.equal(decodeDatTerrain(0xa4), LegacyTerrain.CAROUSEL_SWITCH_RAISED);
  assert.equal(encodeDatTerrain(LegacyTerrain.CAROUSEL_SWITCH_PRESSED), 0xa3);
  assert.equal(encodeDatTerrain(LegacyTerrain.CAROUSEL_SWITCH_RAISED), 0xa4);
});
