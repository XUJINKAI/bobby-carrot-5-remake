import test from "node:test";
import assert from "node:assert/strict";
import { LegacyTerrain } from "../dat/semantic-ids.mjs";
import { decodeDatTerrain, encodeDatTerrain } from "../dat/mapping.mjs";

test("DAT Tide Switch bytes preserve confirmed pressed and raised states", () => {
  assert.equal(decodeDatTerrain(0xa5), LegacyTerrain.TIDE_SWITCH_PRESSED);
  assert.equal(decodeDatTerrain(0xa6), LegacyTerrain.TIDE_SWITCH_RAISED);
  assert.equal(encodeDatTerrain(LegacyTerrain.TIDE_SWITCH_PRESSED), 0xa5);
  assert.equal(encodeDatTerrain(LegacyTerrain.TIDE_SWITCH_RAISED), 0xa6);
});
