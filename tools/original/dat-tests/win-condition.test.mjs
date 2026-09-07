import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { deriveOriginalWinCondition } from "../win-condition.mjs";

const level = (...types) => ({ entities: types.map((type) => ({ type })) });

test("Original carrot map keeps Exit as the final required objective", () => {
  assert.deepEqual(
    deriveOriginalWinCondition(level(MapEntityTypeId.CARROT, MapEntityTypeId.EXIT)),
    {
      type: "all",
      conditions: [
        { type: "collect-all", target: MapEntityTypeId.CARROT },
        { type: "reach", target: MapEntityTypeId.EXIT },
      ],
    },
  );
});

test("Original egg map keeps Exit as the final required objective", () => {
  const expected = {
    type: "all",
    conditions: [
      { type: "fill-all", target: "egg-nest", filler: "egg" },
      { type: "reach", target: MapEntityTypeId.EXIT },
    ],
  };
  assert.deepEqual(
    deriveOriginalWinCondition(
      level(MapEntityTypeId.EGG_NEST, MapEntityTypeId.EXIT),
    ),
    expected,
  );
});

test("Original Golden Carrot map keeps its existing alternative Exit rule", () => {
  assert.deepEqual(
    deriveOriginalWinCondition(
      level(MapEntityTypeId.GOLDEN_CARROT, MapEntityTypeId.EXIT),
    ),
    {
      type: "any",
      conditions: [
        { type: "reach", target: MapEntityTypeId.GOLDEN_CARROT },
        { type: "reach", target: MapEntityTypeId.EXIT },
      ],
    },
  );
});

test("Original exit-only map completes by reaching the exit", () => {
  assert.deepEqual(
    deriveOriginalWinCondition(level(MapEntityTypeId.EXIT)),
    { type: "reach", target: MapEntityTypeId.EXIT },
  );
});

test("Original special scene without a gameplay objective has no synthetic win rule", () => {
  assert.equal(deriveOriginalWinCondition(level(MapEntityTypeId.GROUND_C)), undefined);
});
