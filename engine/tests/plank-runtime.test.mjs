import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { createBuiltinVisualRegistry } from "../dist/entities/registry.js";
import {
  PLANK_DECAY_DURATION_MS,
  PLANK_DECAY_PHASE_MS,
} from "../dist/entities/original/plank.js";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";
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

function worldWithPlank(surfaceType) {
  return new World(
    {
      schemaVersion: 1,
      width: 3,
      height: 1,
      entities: [
        { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
        { type: surfaceType, x: 1, y: 0 },
        { type: EntityTypeId.GROUND_C, x: 2, y: 0 },
        { type: EntityTypeId.PLANK, x: 1, y: 0 },
        { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      ],
    },
    { motionDurationMs: 0 },
  );
}

test("Plank leaves World immediately and water becomes naturally impassable", () => {
  const world = worldWithPlank(EntityTypeId.WATER);
  const actor = world.query.entitiesWithTrait("player")[0];
  const plank = world.query.entitiesWithTrait("terrain-overlay").find(
    (entity) => entity.type === EntityTypeId.PLANK,
  );
  assert.ok(actor && plank);

  assert.equal(move(world, actor.id, "right").moves[0].moved, true);
  const left = move(world, actor.id, "right");
  assert.equal(left.moves[0].moved, true);
  assert.ok(left.events.some((event) => event.type === "plank-decay-started"));
  assert.equal(world.entity(plank.id), undefined);
  assert.equal(world.actions.active.length, 0);
  assert.equal(move(world, actor.id, "left").moves[0].moved, false);
});

test("Destroyed Plank on ordinary ground leaves the ground walkable", () => {
  const world = worldWithPlank(EntityTypeId.GROUND_C);
  const actor = world.query.entitiesWithTrait("player")[0];
  const plank = world.query.entitiesWithTrait("terrain-overlay").find(
    (entity) => entity.type === EntityTypeId.PLANK,
  );
  assert.ok(actor && plank);

  move(world, actor.id, "right");
  move(world, actor.id, "right");
  assert.equal(world.entity(plank.id), undefined);
  assert.equal(move(world, actor.id, "left").moves[0].moved, true);
});

test("Plank decay survives Entity destruction as a transient Presentation visual", () => {
  const world = worldWithPlank(EntityTypeId.WATER);
  const actor = world.query.entitiesWithTrait("player")[0];
  move(world, actor.id, "right");
  const result = move(world, actor.id, "right");

  const visual = new VisualRuntime(createBuiltinVisualRegistry(), 48);
  const options = {
    motionDuration: () => 0,
    stationaryDeathDurationMs: 0,
  };
  const start = { frame: 1, nowMs: 1000, deltaMs: 0 };
  visual.consumeWorldDeltas(world, result.deltas, start, options);
  visual.update(start, "linear");

  let transient = visual.scene(world).world.find(
    (item) => item.presence.entityId < 0,
  );
  assert.ok(transient);
  assert.deepEqual(transient.composition.layers[0], {
    kind: "atlas",
    column: 5,
    row: 13,
  });
  assert.equal(visual.isAnimating, true);

  const fragment = {
    frame: 2,
    nowMs: start.nowMs + PLANK_DECAY_PHASE_MS,
    deltaMs: PLANK_DECAY_PHASE_MS,
  };
  visual.update(fragment, "linear");
  transient = visual.scene(world).world.find(
    (item) => item.presence.entityId < 0,
  );
  assert.ok(transient);
  assert.deepEqual(transient.composition.layers[0], {
    kind: "atlas",
    column: 6,
    row: 13,
  });

  const finished = {
    frame: 3,
    nowMs: start.nowMs + PLANK_DECAY_DURATION_MS,
    deltaMs: PLANK_DECAY_PHASE_MS,
  };
  visual.update(finished, "linear");
  assert.equal(
    visual.scene(world).world.some((item) => item.presence.entityId < 0),
    false,
  );
  assert.equal(visual.isAnimating, false);

  // Presentation rewind may replay the transient without restoring the World Entity.
  visual.update(start, "linear");
  assert.equal(
    visual.scene(world).world.some((item) => item.presence.entityId < 0),
    true,
  );
});
