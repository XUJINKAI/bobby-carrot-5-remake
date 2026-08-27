import test from "node:test";
import assert from "node:assert/strict";
import {
  EntityTypeId,
  World,
  createBuiltinEntityRegistry,
  resolveEntityVisualPreview,
} from "../dist/index.js";

const BLOCKING_TYPES = [
  EntityTypeId.EGG_NEST_FILLED,
  EntityTypeId.WINDMILL_UP,
  EntityTypeId.WINDMILL_DOWN,
  EntityTypeId.WINDMILL_LEFT,
  EntityTypeId.WINDMILL_RIGHT,
  EntityTypeId.PLANK_CRUMBLING,
  EntityTypeId.PLANK_FRAGMENT,
  EntityTypeId.ICE_BLOCK,
];

test("canonical original obstacle semantics keep known blockers blocking", () => {
  const registry = createBuiltinEntityRegistry();
  for (const type of BLOCKING_TYPES) {
    assert.equal(registry.require(type).traits.includes("blocking"), true, type);
  }
});

test("Ice Block cover blocks Bobby instead of becoming pass-through scenery", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
      { type: EntityTypeId.GROUND_C, x: 1, y: 0 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      { type: EntityTypeId.ICE_BLOCK, x: 1, y: 0 },
    ],
  });
  assert.equal(world.move("right").moved, false);
  assert.deepEqual(world.player, { x: 0, y: 0 });
});

test("authoring visual preview resolves through canonical Visual definitions", () => {
  const carrot = resolveEntityVisualPreview({ type: EntityTypeId.CARROT });
  assert.equal(carrot?.layers[0]?.kind, "atlas");
  const fence = resolveEntityVisualPreview({ type: EntityTypeId.FENCE });
  assert.equal(fence?.layers[0]?.kind, "atlas");
});
