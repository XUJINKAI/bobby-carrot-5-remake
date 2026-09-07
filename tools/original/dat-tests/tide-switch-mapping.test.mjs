import test from "node:test";
import assert from "node:assert/strict";
import { DecodedTerrain } from "../dat/semantic-ids.mjs";
import { decodeDatTerrain, encodeDatTerrain } from "../dat/mapping.mjs";

test("DAT Tide Switch bytes preserve confirmed pressed and raised states", () => {
  assert.equal(
    decodeDatTerrain(0xa5),
    "ts-11-6:tide-switch-pressed",
  );
  assert.equal(
    decodeDatTerrain(0xa6),
    "ts-11-7:tide-switch-raised",
  );
  assert.equal(encodeDatTerrain(DecodedTerrain.TIDE_SWITCH_PRESSED), 0xa5);
  assert.equal(encodeDatTerrain(DecodedTerrain.TIDE_SWITCH_RAISED), 0xa6);
});
