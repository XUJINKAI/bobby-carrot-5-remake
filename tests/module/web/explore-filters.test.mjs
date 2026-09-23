import assert from "node:assert/strict";
import { test } from "vitest";
import {
  mapMatchesLevelFilters,
  toggleLevelFilterOption,
} from "../../../web/src/pages/explore/levelFilters.ts";

const options = [
  { id: "a" },
  { id: "b" },
];

test("single filter 同时只保留一个 option", () => {
  const values = new Set(["a"]);
  toggleLevelFilterOption(
    values,
    { id: "count", selection: "single", options },
    "b",
  );
  assert.deepEqual([...values], ["b"]);

  toggleLevelFilterOption(
    values,
    { id: "count", selection: "single", options },
    "b",
  );
  assert.deepEqual([...values], []);
});

test("multiple filter 保留多个 option", () => {
  const values = new Set(["a"]);
  toggleLevelFilterOption(
    values,
    { id: "tags", selection: "multiple", options },
    "b",
  );
  assert.deepEqual([...values], ["a", "b"]);
});

test("所有已选 option 按且关系匹配地图", () => {
  const filters = new Map([
    ["items", new Set(["shovel", "gas"])],
    ["scenes", new Set(["grassland"])],
  ]);
  assert.equal(
    mapMatchesLevelFilters(
      {
        id: "match",
        name: "Match",
        filters: {
          items: ["shovel", "gas"],
          scenes: ["grassland", "water"],
        },
      },
      filters,
    ),
    true,
  );
  assert.equal(
    mapMatchesLevelFilters(
      {
        id: "miss",
        name: "Miss",
        filters: { items: ["shovel"], scenes: ["grassland"] },
      },
      filters,
    ),
    false,
  );
});
