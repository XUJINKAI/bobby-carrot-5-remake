import test from "node:test";
import assert from "node:assert/strict";
import { DecodedTerrain } from "../dat/semantic-ids.mjs";
import { decodeDatTerrain, encodeDatTerrain } from "../dat/mapping.mjs";

test("DAT Tide Switch bytes preserve confirmed pressed and raised states", () => {
  assert.equal(
    decodeDatTerrain(0xa5),
    `${DecodedTerrain.TIDE_SWITCH_PRESSED}:ts-11-6`,
  );
  assert.equal(
    decodeDatTerrain(0xa6),
    `${DecodedTerrain.TIDE_SWITCH_RAISED}:ts-11-7`,
  );
  assert.equal(encodeDatTerrain(DecodedTerrain.TIDE_SWITCH_PRESSED), 0xa5);
  assert.equal(encodeDatTerrain(DecodedTerrain.TIDE_SWITCH_RAISED), 0xa6);
});
