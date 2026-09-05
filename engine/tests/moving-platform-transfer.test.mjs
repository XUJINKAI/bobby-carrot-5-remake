import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../dist/entities/registry.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";
import { SpatialVisualQuery } from "../dist/visual/SpatialVisualQuery.js";
import { World } from "../dist/world/World.js";

function move(world, actorId, direction) {
  return world.step({
    intents: [
      {
        type: "move",
        actorId,
        direction,
        cause: { type: "player-input" },
      },
    ],
  });
}

function resolveTideSwitchVisual(pressed) {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    {
      type: EntityTypeId.TIDE_SWITCH,
      x: 0,
      y: 0,
      state: { pressed },
    },
  ]);
  const spatial = new SpatialIndex(store, entities, 1, 1);
  const entity = store.require(1);
  const presence = spatial.presencesForEntity(entity.id)[0];
  assert.ok(presence);
  const visual = visuals.resolve(entities.require(EntityTypeId.TIDE_SWITCH), {
    entity,
    presence,
    query: new SpatialVisualQuery(store, spatial),
  });
  assert.ok(visual);
  return visual.layers[0];
}

test("Tide Switch canonical pressed state uses the 0xA5 visual", () => {
  assert.deepEqual(resolveTideSwitchVisual(true), {
    kind: "atlas",
    column: 5,
    row: 10,
  });
  assert.deepEqual(resolveTideSwitchVisual(false), {
    kind: "atlas",
    column: 6,
    row: 10,
  });
});

test("Raised Tide Switch reverses Tide and becomes pressed", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 3,
      height: 1,
      entities: [
        { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
        {
          type: EntityTypeId.TIDE_SWITCH,
          x: 1,
          y: 0,
          state: { pressed: false },
        },
        { type: EntityTypeId.WATER, x: 2, y: 0 },
        { type: EntityTypeId.TIDE, x: 2, y: 0, direction: "right" },
        { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      ],
    },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithTrait("player")[0];
  const tideSwitch = world.query.entitiesWithTrait("switch").find(
    (entity) => entity.type === EntityTypeId.TIDE_SWITCH,
  );
  const tide = world.query.entitiesWithTrait("forced-movement").find(
    (entity) => entity.type === EntityTypeId.TIDE,
  );
  assert.ok(actor && tideSwitch && tide);

  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  world.update({ tick: 1, stepMs: 50 });

  assert.equal(world.entity(tideSwitch.id).state.pressed, true);
  assert.equal(world.entity(tide.id).direction, "left");
});

test("Bobby walks directly between adjacent stopped Leaves without mount state", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 2,
      height: 1,
      entities: [
        { type: EntityTypeId.WATER, x: 0, y: 0 },
        { type: EntityTypeId.WATER, x: 1, y: 0 },
        { type: EntityTypeId.LEAF, x: 0, y: 0 },
        { type: EntityTypeId.LEAF, x: 1, y: 0 },
        {
          type: EntityTypeId.BOBBY,
          x: 0,
          y: 0,
          direction: "right",
        },
      ],
    },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithTrait("player")[0];
  assert.ok(actor);

  const result = move(world, actor.id, "right");
  assert.equal(result.moves[0].moved, true);
  assert.equal(world.entity(actor.id).state.mountId, undefined);

  world.update({ tick: 1, stepMs: 50 });
  assert.equal(world.entity(actor.id).state.mountId, undefined);
  world.update({ tick: 2, stepMs: 50 });
  assert.equal(world.entity(actor.id).state.mountId, undefined);
});
