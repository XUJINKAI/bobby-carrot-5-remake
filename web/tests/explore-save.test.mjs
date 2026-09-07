import assert from "node:assert/strict";
import { test } from "vitest";
import { BC5R_GAME_ID } from "@bobby/model";
import {
  parseExploreProgressExchange,
  serializeExploreProgressSave,
} from "../src/storage/exploreProgressStorage.ts";

test("Explore save exchange normalizes collection-scoped progress data", () => {
  const save = parseExploreProgressExchange({
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    mode: "explore",
    collections: {
      original: {
        game: BC5R_GAME_ID,
        schemaVersion: 1,
        completedMaps: ["1-2", "1-1", "1-1"],
        lastMap: "1-2",
      },
      custom: {
        game: BC5R_GAME_ID,
        schemaVersion: 1,
        completedMaps: ["demo"],
        lastMap: "demo",
      },
    },
  });

  assert.deepEqual(save.collections.original.completedMaps, ["1-1", "1-2"]);
  assert.equal(save.collections.original.lastMap, "1-2");
  assert.deepEqual(JSON.parse(serializeExploreProgressSave(save)), save);
});

test("Explore save exchange rejects unrelated data", () => {
  assert.throws(
    () =>
      parseExploreProgressExchange({
        game: BC5R_GAME_ID,
        schemaVersion: 1,
      }),
    /Explore Save/,
  );
});
