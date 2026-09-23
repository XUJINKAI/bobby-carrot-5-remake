import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import {
  ROBO2_GAMEPLAY_IMAGE_IDS,
} from "../../engine/dist/public.js";
import { createBuiltinEntityRegistry } from "../../engine/dist/entities/registry.js";
import { resolveLevelEntityVisualPreview } from "../../engine/dist/visual/preview.js";
import { World } from "../support/engine/World.mjs";

const ground = (x) => ({
  type: MapEntityTypeId.GRASS,
  variant: "ts-10-1",
  x,
  y: 0,
});

function createWorld() {
  return new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      ground(0),
      ground(1),
      ground(2),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      { type: MapEntityTypeId.LASER_STONE, x: 1, y: 0 },
    ],
  });
}

function createAnimatedWorld() {
  return new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      ground(0),
      ground(1),
      ground(2),
      ground(3),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      { type: MapEntityTypeId.LASER_STONE, x: 1, y: 0 },
    ],
  }, { motionDurationMs: 350 });
}

function moveRight(world) {
  const actor = world.query.entitiesWithFact("player")[0];
  return world.step({
    intents: [
      {
        type: "move",
        actorId: actor.id,
        direction: "right",
        cause: { type: "player-input", source: "test" },
      },
    ],
  }).moves[0];
}

function stone(world) {
  return world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LASER_STONE,
  })[0];
}

test("Laser Stone 使用通用推动规则，边界会阻止连续推动", () => {
  const world = createWorld();

  assert.equal(moveRight(world).moved, true);
  assert.deepEqual(stone(world).anchor, { x: 2, y: 0 });
  assert.deepEqual(world.query.entitiesWithFact("player")[0].anchor, {
    x: 1,
    y: 0,
  });

  assert.equal(moveRight(world).moved, false);
  assert.deepEqual(stone(world).anchor, { x: 2, y: 0 });
});

test("快速 Bobby 与被推动的 Laser Stone 使用同一移动时长", () => {
  const world = createAnimatedWorld();
  const actor = world.query.entitiesWithFact("player")[0];
  world.entities.require(actor.id).state = { locomotionMoveMs: 100 };

  const result = world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "right",
      cause: { type: "player-input", source: "test" },
    }],
  });

  assert.deepEqual(result.motions.map((motion) => motion.durationMs), [100, 100]);
  world.update({ tick: 0, stepMs: 100 });
  assert.equal(world.movement.running.length, 0);
  assert.equal(world.inputBlocked, false);
});

test("Laser Stone 注册为阻挡、可推动对象，并使用 Robo 2 原图", () => {
  const definition = createBuiltinEntityRegistry().require(
    MapEntityTypeId.LASER_STONE,
  );
  assert.deepEqual(definition.presenceFacts, ["blocking", "pushable"]);
  assert.deepEqual(
    resolveLevelEntityVisualPreview({ type: MapEntityTypeId.LASER_STONE }),
    {
      layers: [{
        kind: "image",
        asset: ROBO2_GAMEPLAY_IMAGE_IDS.stone,
        sourceTileSize: 12,
        anchor: "top-left",
      }],
    },
  );
});
