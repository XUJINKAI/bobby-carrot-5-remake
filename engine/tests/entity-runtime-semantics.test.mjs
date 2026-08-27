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

const ground = (x, y) => ({ type: EntityTypeId.GROUND_C, x, y });
const bobby = (x, y) => ({
  type: EntityTypeId.BOBBY,
  x,
  y,
  direction: "right",
});

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
      ground(0, 0),
      ground(1, 0),
      bobby(0, 0),
      { type: EntityTypeId.ICE_BLOCK, x: 1, y: 0 },
    ],
  });
  assert.equal(world.move("right").moved, false);
  assert.deepEqual(world.player, { x: 0, y: 0 });
});

test("Water requires a terrain overlay for ordinary Bobby movement", () => {
  const direct = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      { type: EntityTypeId.WATER, x: 1, y: 0 },
      bobby(0, 0),
    ],
  });
  assert.equal(direct.move("right").moved, false);

  const withPlank = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      { type: EntityTypeId.WATER, x: 1, y: 0 },
      { type: EntityTypeId.PLANK, x: 1, y: 0 },
      bobby(0, 0),
    ],
  });
  assert.equal(withPlank.move("right").moved, true);
});

test("Unified color block uses state instead of split types for passage", () => {
  const raised = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      {
        type: EntityTypeId.COLOR_YELLOW_BLOCK,
        x: 1,
        y: 0,
        state: { raised: true },
      },
      bobby(0, 0),
    ],
  });
  assert.equal(raised.move("right").moved, false);

  const lowered = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      {
        type: EntityTypeId.COLOR_YELLOW_BLOCK,
        x: 1,
        y: 0,
        state: { raised: false },
      },
      bobby(0, 0),
    ],
  });
  assert.equal(lowered.move("right").moved, true);
});

test("authoring visual preview resolves through canonical Visual definitions", () => {
  const carrot = resolveEntityVisualPreview({ type: EntityTypeId.CARROT });
  assert.equal(carrot?.layers[0]?.kind, "atlas");
  const fence = resolveEntityVisualPreview({ type: EntityTypeId.FENCE });
  assert.equal(fence?.layers[0]?.kind, "atlas");
});
