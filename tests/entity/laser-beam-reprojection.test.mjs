import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { LASER_BOMB_IGNITION_DURATION_MS } from "../../engine/dist/entities/robo2/laser-bomb.js";
import { RuntimeEntityTypeId } from "../../engine/dist/entities/runtime-types.js";
import { World } from "../support/engine/World.mjs";

const BOMB_REMAINING_MS = 10;

function ground(x, y) {
  return {
    type: MapEntityTypeId.GRASS,
    variant: "ts-10-1",
    x,
    y,
  };
}

function createBombRayWorld(actorPosition) {
  const entities = [];
  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 8; x += 1) entities.push(ground(x, y));
  }
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 0 },
    { type: MapEntityTypeId.LASER_BOMB, x: 4, y: 0 },
    { type: MapEntityTypeId.BOBBY, ...actorPosition },
  );
  return new World(
    { schemaVersion: 1, width: 8, height: 2, entities },
    { motionDurationMs: 100 },
  );
}

function beamIdsByX(world) {
  return new Map(world.query.entitiesMatching({
    kind: "type",
    value: RuntimeEntityTypeId.LASER_BEAM,
  }).map((beam) => [beam.anchor.x, beam.id]));
}

function prepareBombExplosion(world) {
  world.update({ tick: 0, stepMs: 1 });
  world.update({
    tick: 1,
    stepMs: LASER_BOMB_IGNITION_DURATION_MS - BOMB_REMAINING_MS,
  });
}

function moveUp(world, actorId) {
  const result = world.step({
    intents: [{
      type: "move",
      actorId,
      direction: "up",
      cause: { type: "player-input", source: "test" },
    }],
  });
  assert.equal(result.moves[0].moved, true);
}

test("远端 Bomb 延长光路时保留上游 beam，并维持八成伤害时点", () => {
  const world = createBombRayWorld({ x: 2, y: 1 });
  const actor = world.query.entitiesWithFact("player")[0];
  prepareBombExplosion(world);
  const beamIdsBefore = beamIdsByX(world);

  moveUp(world, actor.id);
  world.update({ tick: 2, stepMs: BOMB_REMAINING_MS });

  const beamIdsAfter = beamIdsByX(world);
  for (const x of [1, 2, 3]) {
    assert.equal(beamIdsAfter.get(x), beamIdsBefore.get(x));
  }
  assert.equal(world.actorLifecycle(actor.id).phase, "active");
  assert.equal(world.movement.motions.forEntity(actor.id).progress, 0.1);

  world.update({ tick: 3, stepMs: 69 });
  assert.equal(world.actorLifecycle(actor.id).phase, "active");
  assert.equal(world.movement.motions.forEntity(actor.id).progress, 0.79);

  world.update({ tick: 4, stepMs: 1 });
  assert.equal(world.actorLifecycle(actor.id).reason, "laser-beam");
  assert.equal(world.movement.motions.forEntity(actor.id).progress, 0.8);
});

test("新出现的 beam 覆盖移动中的 Bobby 时维持八成伤害时点", () => {
  const world = createBombRayWorld({ x: 6, y: 1 });
  const actor = world.query.entitiesWithFact("player")[0];
  prepareBombExplosion(world);

  moveUp(world, actor.id);
  world.update({ tick: 2, stepMs: BOMB_REMAINING_MS });
  assert.equal(world.actorLifecycle(actor.id).phase, "active");
  assert.equal(world.movement.motions.forEntity(actor.id).progress, 0.1);

  world.update({ tick: 3, stepMs: 69 });
  assert.equal(world.actorLifecycle(actor.id).phase, "active");
  assert.equal(world.movement.motions.forEntity(actor.id).progress, 0.79);

  world.update({ tick: 4, stepMs: 1 });
  assert.equal(world.actorLifecycle(actor.id).reason, "laser-beam");
  assert.equal(world.movement.motions.forEntity(actor.id).progress, 0.8);
});

test("新出现的 beam 覆盖静止 Bobby 时立即造成伤害", () => {
  const world = createBombRayWorld({ x: 6, y: 0 });
  const actor = world.query.entitiesWithFact("player")[0];
  prepareBombExplosion(world);

  world.update({ tick: 2, stepMs: BOMB_REMAINING_MS });

  assert.equal(world.actorLifecycle(actor.id).reason, "laser-beam");
});
