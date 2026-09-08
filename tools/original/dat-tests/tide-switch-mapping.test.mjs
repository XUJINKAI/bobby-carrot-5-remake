import test from "node:test";
import assert from "node:assert/strict";
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
  assert.equal(encodeDatTerrain(decodeDatTerrain(0xa5)), 0xa5);
  assert.equal(encodeDatTerrain(decodeDatTerrain(0xa6)), 0xa6);
});
