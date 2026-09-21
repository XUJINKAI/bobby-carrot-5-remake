import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { createBuiltinEntityRegistry } from "../../engine/dist/entities/registry.js";
import { RuntimeEntityTypeId } from "../../engine/dist/entities/runtime-types.js";
import { resolveLevelEntityVisualPreview } from "../../engine/dist/visual/preview.js";
import { World } from "../support/engine/World.mjs";

const ground = (x, y) => ({
  type: MapEntityTypeId.GRASS,
  variant: "ts-10-1",
  x,
  y,
});

const origins = {
  up: { x: 2, y: 4 },
  right: { x: 0, y: 2 },
  down: { x: 2, y: 0 },
  left: { x: 4, y: 2 },
};

const reflections = {
  slash: {
    up: { outgoing: "right", endpoint: { x: 4, y: 2 } },
    right: { outgoing: "up", endpoint: { x: 2, y: 0 } },
    down: { outgoing: "left", endpoint: { x: 0, y: 2 } },
    left: { outgoing: "down", endpoint: { x: 2, y: 4 } },
  },
  backslash: {
    up: { outgoing: "left", endpoint: { x: 0, y: 2 } },
    right: { outgoing: "down", endpoint: { x: 2, y: 4 } },
    down: { outgoing: "right", endpoint: { x: 4, y: 2 } },
    left: { outgoing: "up", endpoint: { x: 2, y: 0 } },
  },
};

function createReflectionWorld(variant, direction) {
  const entities = [];
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 5; x += 1) {
      entities.push(ground(x, y));
    }
  }
  entities.push(
    {
      type: MapEntityTypeId.LASER_EMITTER,
      direction,
      ...origins[direction],
    },
    { type: MapEntityTypeId.LASER_MIRROR, variant, x: 2, y: 2 },
  );
  return new World({ schemaVersion: 1, width: 5, height: 5, entities });
}

function beamEntities(world) {
  return world.query.entitiesMatching({
    kind: "type",
    value: RuntimeEntityTypeId.LASER_BEAM,
  });
}

test("两种激光镜从双面按对角线反射四种入射方向", () => {
  for (const [variant, directions] of Object.entries(reflections)) {
    for (const [incoming, expected] of Object.entries(directions)) {
      const beams = beamEntities(createReflectionWorld(variant, incoming));
      const mirrorBeam = beams.find(
        (beam) => beam.anchor.x === 2 && beam.anchor.y === 2,
      );

      assert.equal(mirrorBeam?.direction, incoming, `${variant}/${incoming}`);
      assert.equal(
        mirrorBeam?.state?.outgoingDirection,
        expected.outgoing,
        `${variant}/${incoming}`,
      );
      assert.deepEqual(
        beams.at(-1)?.anchor,
        expected.endpoint,
        `${variant}/${incoming}`,
      );
    }
  }
});

test("激光镜使用通用推动规则", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 2,
    entities: [
      ground(0, 0),
      ground(1, 0),
      ground(2, 0),
      ground(0, 1),
      ground(1, 1),
      ground(2, 1),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 1 },
      { type: MapEntityTypeId.LASER_MIRROR, variant: "slash", x: 1, y: 1 },
    ],
  });
  const actor = world.query.entitiesWithFact("player")[0];
  const mirror = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LASER_MIRROR,
  })[0];

  const result = world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "right",
      cause: { type: "player-input", source: "test" },
    }],
  });

  assert.equal(result.moves[0].moved, true);
  assert.deepEqual(world.entity(mirror.id).anchor, { x: 2, y: 1 });
});

test("镜面移动后重新投影的光路会击中静止 Bobby", () => {
  const entities = [];
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      entities.push(ground(x, y));
    }
  }
  entities.push(
    { type: MapEntityTypeId.LASER_EMITTER, direction: "right", x: 0, y: 2 },
    { type: MapEntityTypeId.LASER_MIRROR, variant: "slash", x: 2, y: 3 },
    { type: MapEntityTypeId.BOBBY, x: 2, y: 4 },
    { type: MapEntityTypeId.BOBBY, x: 2, y: 0 },
  );
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 5,
    entities,
  });
  const [pusher, target] = world.query.entitiesWithFact("player");

  world.step({
    intents: [{
      type: "move",
      actorId: pusher.id,
      direction: "up",
      cause: { type: "player-input", source: "test" },
    }],
  });
  world.update({ tick: 0, stepMs: 16 });

  assert.equal(world.dead, true);
  assert.equal(world.actorLifecycle(target.id).reason, "laser-beam");
});

test("激光镜注册为阻挡、可推动对象，并复用 Mirror 视觉", () => {
  const definition = createBuiltinEntityRegistry().require(
    MapEntityTypeId.LASER_MIRROR,
  );
  assert.deepEqual(definition.presenceFacts, ["blocking", "pushable"]);
  assert.deepEqual(
    resolveLevelEntityVisualPreview({
      type: MapEntityTypeId.LASER_MIRROR,
      variant: "slash",
    }),
    resolveLevelEntityVisualPreview({
      type: MapEntityTypeId.MIRROR,
      variant: "left-top",
    }),
  );
  assert.deepEqual(
    resolveLevelEntityVisualPreview({
      type: MapEntityTypeId.LASER_MIRROR,
      variant: "backslash",
    }),
    resolveLevelEntityVisualPreview({
      type: MapEntityTypeId.MIRROR,
      variant: "right-top",
    }),
  );
});
