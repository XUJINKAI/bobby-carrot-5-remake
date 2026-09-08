import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { World } from "../dist/world/World.js";
import { createBuiltinEntityRegistry } from "../dist/entities/registry.js";
import {
  resolveEntityVisualPreview,
  resolveLevelEntityVisualPreview,
} from "../dist/visual/preview.js";

const BLOCKING_TYPES = [
  MapEntityTypeId.WINDMILL,
  MapEntityTypeId.ICE_BLOCK,
];

const ground = (x, y) => ({ type: "grass", variant: "ts-10-1", x, y });
const bobby = (x, y) => ({
  type: MapEntityTypeId.BOBBY,
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
  });
}

test("canonical original obstacle semantics keep known blockers blocking", () => {
  const registry = createBuiltinEntityRegistry();
  for (const type of BLOCKING_TYPES) {
    assert.equal(registry.require(type).traits.includes("blocking"), true, type);
  }
});

test("stone-wall 根据 atlas variant 使用各自的 Surface Trait", () => {
  const wall = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      bobby(0, 0),
      { type: MapEntityTypeId.STONE_WALL, variant: "ts-1-4", x: 1, y: 0 },
    ],
  });
  const wallEntity = wall.entities
    .all()
    .find((entity) => entity.type === MapEntityTypeId.STONE_WALL);
  assert.ok(wallEntity);
  assert.equal(
    wall.query.entityHasTrait(wallEntity.id, "bean-growth-space"),
    true,
  );
  assert.equal(wall.query.entityHasTrait(wallEntity.id, "walkable"), false);
  assert.equal(move(wall, "right").moves[0].moved, false);

  const shadowRoad = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      bobby(0, 0),
      { type: MapEntityTypeId.STONE_WALL, variant: "ts-10-3", x: 1, y: 0 },
    ],
  });
  const shadowEntity = shadowRoad.entities
    .all()
    .find((entity) => entity.type === MapEntityTypeId.STONE_WALL);
  assert.ok(shadowEntity);
  assert.equal(
    shadowRoad.query.entityHasTrait(shadowEntity.id, "bean-growth-space"),
    false,
  );
  assert.equal(
    shadowRoad.query.entityHasTrait(shadowEntity.id, "walkable"),
    true,
  );
  assert.equal(move(shadowRoad, "right").moves[0].moved, true);
});

test("Egg Nest fills only when Bobby leaves the empty nest", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    rules: {
      win: { type: "fill-all", target: "egg-nest", filler: "filled-egg" },
    },
    entities: [
      ground(0, 0),
      ground(1, 0),
      ground(2, 0),
      bobby(0, 0),
      { type: MapEntityTypeId.EGG, x: 1, y: 0 },
    ],
  });

  assert.equal(world.winState?.remaining, 1);
  const enter = move(world, "right");
  assert.equal(enter.moves[0].moved, true);
  assert.equal(world.winState?.remaining, 1);
  assert.equal(
    world.entities
      .all()
      .some(
        (entity) =>
          entity.type === MapEntityTypeId.EGG &&
          entity.state?.filled !== true,
      ),
    true,
  );

  const leave = move(world, "right");
  assert.equal(leave.moves[0].moved, true);
  assert.equal(
    leave.events.some((event) => event.type === "fill-egg-nest"),
    true,
  );
  const filledEgg = world.entities
    .all()
    .find((entity) => entity.type === MapEntityTypeId.EGG);
  assert.equal(filledEgg?.state?.filled, true);
  assert.ok(filledEgg);
  assert.equal(world.query.entityHasTrait(filledEgg.id, "filled-egg"), true);
  assert.equal(world.query.entityHasTrait(filledEgg.id, "blocking"), true);
  assert.deepEqual(world.winState, {
    type: "fill-all",
    target: "egg-nest",
    filler: "filled-egg",
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
      { type: MapEntityTypeId.ICE_BLOCK, x: 1, y: 0 },
    ],
  });
  assert.equal(move(world, "right").moves[0].moved, false);
  assert.deepEqual(actor(world).anchor, { x: 0, y: 0 });
});

test("Water requires a terrain overlay for ordinary Bobby movement", () => {
  const direct = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      { type: MapEntityTypeId.WATER, x: 1, y: 0 },
      bobby(0, 0),
    ],
  });
  assert.equal(move(direct, "right").moves[0].moved, false);

  const withPlank = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      { type: MapEntityTypeId.WATER, x: 1, y: 0 },
      { type: MapEntityTypeId.PLANK, x: 1, y: 0 },
      bobby(0, 0),
    ],
  });
  assert.equal(move(withPlank, "right").moves[0].moved, true);
});

test("Unified color block uses flat color and raised fields for passage", () => {
  const raised = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      {
        type: MapEntityTypeId.COLOR_BLOCK,
        x: 1,
        y: 0,
        color: "yellow",
        raised: true,
      },
      bobby(0, 0),
    ],
  });
  assert.equal(
    raised.entities.all().some((entity) => entity.type === MapEntityTypeId.COLOR_BLOCK),
    true,
  );
  assert.equal(move(raised, "right").moves[0].moved, false);

  const lowered = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      {
        type: MapEntityTypeId.COLOR_BLOCK,
        x: 1,
        y: 0,
        color: "yellow",
        raised: false,
      },
      bobby(0, 0),
    ],
  });
  assert.equal(move(lowered, "right").moves[0].moved, true);
});

test("Color Switch toggles only switches and blocks of the same color", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      ground(2, 0),
      bobby(0, 0),
      {
        type: MapEntityTypeId.COLOR_SWITCH,
        x: 1,
        y: 0,
        color: "yellow",
      },
      {
        type: MapEntityTypeId.COLOR_SWITCH,
        x: 2,
        y: 0,
        color: "pink",
      },
      {
        type: MapEntityTypeId.COLOR_BLOCK,
        x: 2,
        y: 0,
        color: "yellow",
      },
      {
        type: MapEntityTypeId.COLOR_BLOCK,
        x: 2,
        y: 0,
        color: "pink",
      },
    ],
  });

  assert.equal(move(world, "right").moves[0].moved, true);
  const switches = world.query.entitiesWithTrait("switch");
  const blocks = world.query.entitiesWithTrait("stateful-block");
  assert.equal(
    switches.find((entity) => entity.state.color === "yellow").state.state,
    "state-2",
  );
  assert.equal(
    switches.find((entity) => entity.state.color === "pink").state.state,
    "state-1",
  );
  assert.equal(
    blocks.find((entity) => entity.state.color === "yellow").state.raised,
    false,
  );
  assert.equal(
    blocks.find((entity) => entity.state.color === "pink").state.raised,
    true,
  );
});

test("authoring visual preview resolves through canonical Visual definitions", () => {
  const carrot = resolveEntityVisualPreview({ type: MapEntityTypeId.CARROT });
  assert.equal(carrot?.layers[0]?.kind, "atlas");
  const fence = resolveEntityVisualPreview({ type: MapEntityTypeId.FENCE });
  assert.equal(fence?.layers[0]?.kind, "atlas");
});


test("collection icon preview translates canonical flat Map entities", () => {
  const beanstalk = resolveLevelEntityVisualPreview({
    type: MapEntityTypeId.BEANSTALK,
  });
  assert.ok(beanstalk?.layers.length);

  const mirror = resolveLevelEntityVisualPreview({
    type: MapEntityTypeId.MIRROR,
    variant: "left-bottom",
  });
  assert.equal(mirror?.layers[0]?.kind, "atlas");
});
