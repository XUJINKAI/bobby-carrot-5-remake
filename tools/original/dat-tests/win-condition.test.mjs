import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { deriveOriginalWinCondition } from "../win-condition.mjs";

const level = (...types) => ({ entities: types.map((type) => ({ type })) });

test("Original carrot map completes by collecting carrots even when it also has an exit", () => {
  assert.deepEqual(
    deriveOriginalWinCondition(level(EntityTypeId.CARROT, EntityTypeId.EXIT)),
    { type: "collect-all", target: EntityTypeId.CARROT },
  );
});

test("Original egg map completes by filling nests instead of reaching its exit", () => {
  assert.deepEqual(
    deriveOriginalWinCondition(
      level(EntityTypeId.EGG_NEST_EMPTY, EntityTypeId.EXIT),
    ),
    { type: "fill-all", target: "egg-nest", filler: "egg" },
  );
  assert.deepEqual(
    deriveOriginalWinCondition(
      level(EntityTypeId.EGG_NEST_FILLED, EntityTypeId.EXIT),
    ),
    { type: "fill-all", target: "egg-nest", filler: "egg" },
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
