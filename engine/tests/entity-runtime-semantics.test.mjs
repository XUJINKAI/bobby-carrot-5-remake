import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { World } from "../dist/world/World.js";
import { createBuiltinEntityRegistry } from "../dist/entities/registry.js";
import { resolveEntityVisualPreview } from "../dist/visual/preview.js";

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

function actor(world) {
  const entity = world.query.entitiesWithTrait("player")[0];
  assert.ok(entity, "test map must contain a player actor");
  return entity;
}

function move(world, direction) {
  const player = actor(world);
  return world.step({
    intents: [
      {
        type: "move",
        actorId: player.id,
        direction,
        cause: { type: "player-input", source: "test" },
      },
    ],
  }).moves[0];
}

test("canonical original obstacle semantics keep known blockers blocking", () => {
  const registry = createBuiltinEntityRegistry();
  for (const type of BLOCKING_TYPES) {
    assert.equal(registry.require(type).traits.includes("blocking"), true, type);
  }
});

test("Egg Nest fills only when Bobby leaves the empty nest", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    rules: {
      win: { type: "fill-all", target: "egg-nest", filler: "egg" },
    },
    entities: [
      ground(0, 0),
      ground(1, 0),
      ground(2, 0),
      bobby(0, 0),
      { type: EntityTypeId.EGG_NEST_EMPTY, x: 1, y: 0 },
    ],
  });

  assert.equal(world.winState?.remaining, 1);
  const enter = move(world, "right");
  assert.equal(enter.moved, true);
  assert.equal(world.winState?.remaining, 1);
  assert.equal(
    world.entities
      .all()
      .some((entity) => entity.type === EntityTypeId.EGG_NEST_EMPTY),
    true,
  );

  const leave = move(world, "right");
  assert.equal(leave.moved, true);
  assert.equal(
    leave.events.some((event) => event.type === "fill-egg-nest"),
    true,
  );
  assert.equal(
    world.entities
      .all()
      .some((entity) => entity.type === EntityTypeId.EGG_NEST_EMPTY),
    false,
  );
  assert.equal(
    world.entities
      .all()
      .some((entity) => entity.type === EntityTypeId.EGG_NEST_FILLED),
    true,
  );
  assert.deepEqual(world.winState, {
    type: "fill-all",
    target: "egg-nest",
    filler: "egg",
    completed: true,
    remaining: 0,
  });
  assert.equal(world.completed, true);
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
  assert.equal(move(world, "right").moved, false);
  assert.deepEqual(actor(world).anchor, { x: 0, y: 0 });
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
  assert.equal(move(direct, "right").moved, false);

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
  assert.equal(move(withPlank, "right").moved, true);
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
  assert.equal(move(raised, "right").moved, false);

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
  assert.equal(move(lowered, "right").moved, true);
});

test("authoring visual preview resolves through canonical Visual definitions", () => {
  const carrot = resolveEntityVisualPreview({ type: EntityTypeId.CARROT });
  assert.equal(carrot?.layers[0]?.kind, "atlas");
  const fence = resolveEntityVisualPreview({ type: EntityTypeId.FENCE });
  assert.equal(fence?.layers[0]?.kind, "atlas");
});
