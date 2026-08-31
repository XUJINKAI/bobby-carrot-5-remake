import assert from "node:assert/strict";
import { test } from "vitest";
import {
  parseExploreProgressExchange,
  serializeExploreProgressSave,
} from "../src/storage/exploreProgressStorage.ts";

test("Explore save exchange normalizes versioned progress data", () => {
  const save = parseExploreProgressExchange({
    game: "bc5r",
    schemaVersion: 1,
    mode: "explore",
    completedMaps: {
      original: ["1-2", "1-1", "1-1"],
      custom: ["demo"],
    },
    lastMaps: {
      original: "1-2",
      custom: "demo",
    },
  });

  assert.deepEqual(save.completedMaps.original, ["1-1", "1-2"]);
  assert.equal(save.lastMaps.original, "1-2");
  assert.deepEqual(JSON.parse(serializeExploreProgressSave(save)), save);
});

test("Explore save exchange rejects unrelated data", () => {
  assert.throws(
    () => parseExploreProgressExchange({ game: "bc5r", schemaVersion: 1 }),
    /Explore Save/,
  );
});
