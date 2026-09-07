import test from "node:test";
import assert from "node:assert/strict";
import { DecodedTerrain } from "../dat/semantic-ids.mjs";
import { decodeDatTerrain, encodeDatTerrain } from "../dat/mapping.mjs";

test("DAT Carousel Switch bytes preserve confirmed pressed and raised states", () => {
  assert.equal(
    decodeDatTerrain(0xa3),
    `${DecodedTerrain.CAROUSEL_SWITCH_PRESSED}:ts-11-4`,
  );
  assert.equal(
    decodeDatTerrain(0xa4),
    `${DecodedTerrain.CAROUSEL_SWITCH_RAISED}:ts-11-5`,
  );
  assert.equal(encodeDatTerrain(DecodedTerrain.CAROUSEL_SWITCH_PRESSED), 0xa3);
  assert.equal(encodeDatTerrain(DecodedTerrain.CAROUSEL_SWITCH_RAISED), 0xa4);
});
