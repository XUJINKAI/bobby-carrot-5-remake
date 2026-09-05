import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { deriveOriginalWinCondition } from "../win-condition.mjs";

const level = (...types) => ({ entities: types.map((type) => ({ type })) });

test("Original carrot map keeps Exit as the final required objective", () => {
  assert.deepEqual(
    deriveOriginalWinCondition(level(EntityTypeId.CARROT, EntityTypeId.EXIT)),
    {
      type: "all",
      conditions: [
        { type: "collect-all", target: EntityTypeId.CARROT },
        { type: "reach", target: EntityTypeId.EXIT },
      ],
    },
  );
});

test("Original egg map keeps Exit as the final required objective", () => {
  const expected = {
    type: "all",
    conditions: [
      { type: "fill-all", target: "egg-nest", filler: "egg" },
      { type: "reach", target: EntityTypeId.EXIT },
    ],
  };
  assert.deepEqual(
    deriveOriginalWinCondition(
      level(EntityTypeId.EGG_NEST_EMPTY, EntityTypeId.EXIT),
    ),
    expected,
  );
  assert.deepEqual(
    deriveOriginalWinCondition(
      level(EntityTypeId.EGG_NEST_FILLED, EntityTypeId.EXIT),
    ),
    expected,
  );
});

test("Original Golden Carrot map keeps its existing alternative Exit rule", () => {
  assert.deepEqual(
    deriveOriginalWinCondition(
      level(EntityTypeId.GOLDEN_CARROT, EntityTypeId.EXIT),
    ),
    {
      type: "any",
      conditions: [
        { type: "reach", target: EntityTypeId.GOLDEN_CARROT },
        { type: "reach", target: EntityTypeId.EXIT },
      ],
    },
  );
});

test("Original exit-only map completes by reaching the exit", () => {
  assert.deepEqual(
    deriveOriginalWinCondition(level(EntityTypeId.EXIT)),
    { type: "reach", target: EntityTypeId.EXIT },
  );
});

test("Original special scene without a gameplay objective has no synthetic win rule", () => {
  assert.equal(deriveOriginalWinCondition(level(EntityTypeId.GROUND_C)), undefined);
});
