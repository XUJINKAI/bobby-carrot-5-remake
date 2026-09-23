import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../../engine/dist/entities/registry.js";
import { RuntimeEntityTypeId } from "../../engine/dist/entities/runtime-types.js";
import {
  ROBO2_GAMEPLAY_IMAGE_IDS,
} from "../../engine/dist/public.js";
import { resolveLevelEntityVisualPreview } from "../../engine/dist/visual/preview.js";
import { buildVisualScene } from "../../engine/dist/visual/VisualSceneBuilder.js";
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
      type: MapEntityTypeId.LASER_CANNON,
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

test("激光按四种原版 Mirror variant 单面反射", () => {
  const originalReflections = {
    "right-bottom": { left: "down", up: "right" },
    "left-bottom": { right: "down", up: "left" },
    "right-top": { left: "up", down: "right" },
    "left-top": { right: "up", down: "left" },
  };
  for (const [variant, table] of Object.entries(originalReflections)) {
    for (const [incoming, origin] of Object.entries(origins)) {
      const entities = [];
      for (let y = 0; y < 5; y += 1) {
        for (let x = 0; x < 5; x += 1) entities.push(ground(x, y));
      }
      entities.push(
        { type: MapEntityTypeId.LASER_CANNON, direction: incoming, ...origin },
        { type: MapEntityTypeId.MIRROR, variant, x: 2, y: 2 },
      );
      const beams = beamEntities(
        new World({ schemaVersion: 1, width: 5, height: 5, entities }),
      );
      const mirrorBeam = beams.find(
        (beam) => beam.anchor.x === 2 && beam.anchor.y === 2,
      );
      const expected = table[incoming];

      assert.equal(mirrorBeam?.direction, incoming, `${variant}/${incoming}`);
      assert.equal(
        mirrorBeam?.state?.outgoingDirection,
        expected,
        `${variant}/${incoming}`,
      );
      assert.equal(
        mirrorBeam?.state?.terminal,
        expected === undefined,
        `${variant}/${incoming}`,
      );
    }
  }
});

test("镜面按朝向覆绘指定方向的入射光", () => {
  const covered = {
    slash: new Set(["right", "down"]),
    backslash: new Set(["left", "down"]),
  };
  for (const variant of ["slash", "backslash"]) {
    for (const incoming of ["up", "right", "down", "left"]) {
      const world = createReflectionWorld(variant, incoming);
      const mirror = world.query.entitiesMatching({
        kind: "type",
        value: MapEntityTypeId.LASER_MIRROR,
      })[0];
      const mirrorBeam = beamEntities(world).find(
        (beam) => beam.anchor.x === 2 && beam.anchor.y === 2,
      );
      assert.ok(mirrorBeam, `${variant}/${incoming}`);
      const scene = buildVisualScene(
        world,
        createBuiltinVisualRegistry(),
        new Map(),
      );
      const mirrorStandingIndex = scene.standing.findIndex(
        (item) => item.presence.entityId === mirror.id,
      );
      const beamAboveMirror = scene.effect.some(
        (item) => item.presence.entityId === mirrorBeam.id,
      );
      const beamUnderMirror = scene.worldEffect.some(
        (item) => item.presence.entityId === mirrorBeam.id,
      );

      assert.notEqual(mirrorStandingIndex, -1, `${variant}/${incoming}`);
      if (covered[variant].has(incoming)) {
        assert.equal(beamUnderMirror, true, `${variant}/${incoming}`);
        assert.equal(beamAboveMirror, false, `${variant}/${incoming}`);
      } else {
        assert.equal(beamUnderMirror, false, `${variant}/${incoming}`);
        assert.equal(beamAboveMirror, true, `${variant}/${incoming}`);
      }
    }
  }
});

test("镜面与 Bobby 按脚点深度排序", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 3,
    entities: [
      ground(1, 1),
      ground(1, 2),
      { type: MapEntityTypeId.LASER_MIRROR, variant: "slash", x: 1, y: 1 },
      { type: MapEntityTypeId.BOBBY, x: 1, y: 2 },
    ],
  });
  const mirror = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.LASER_MIRROR,
  })[0];
  const bobby = world.query.entitiesWithFact("player")[0];
  const scene = buildVisualScene(
    world,
    createBuiltinVisualRegistry(),
    new Map(),
  );

  assert.deepEqual(
    scene.standing
      .filter((item) =>
        item.presence.entityId === mirror.id ||
        item.presence.entityId === bobby.id
      )
      .map((item) => item.presence.entityId),
    [mirror.id, bobby.id],
  );
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
    { type: MapEntityTypeId.LASER_CANNON, direction: "right", x: 0, y: 2 },
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

test("原版 Mirror 旋转后立即按新朝向重新投影激光", () => {
  const entities = [];
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 5; x += 1) entities.push(ground(x, y));
  }
  entities.push(
    { type: MapEntityTypeId.LASER_CANNON, direction: "up", x: 2, y: 4 },
    { type: MapEntityTypeId.MIRROR, variant: "right-bottom", x: 2, y: 2 },
    { type: MapEntityTypeId.BOBBY, x: 2, y: 2 },
  );
  const world = new World({ schemaVersion: 1, width: 5, height: 5, entities });
  const actor = world.query.entitiesWithFact("player")[0];
  const mirror = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.MIRROR,
  })[0];

  assert.equal(
    beamEntities(world).find((beam) =>
      beam.anchor.x === 2 && beam.anchor.y === 2
    )?.state?.outgoingDirection,
    "right",
  );
  world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "up",
      cause: { type: "player-input", source: "test" },
    }],
  });
  world.update({ tick: 0, stepMs: 16 });

  assert.equal(world.entity(mirror.id).state?.variant, "left-bottom");
  assert.equal(
    beamEntities(world).find((beam) =>
      beam.anchor.x === 2 && beam.anchor.y === 2
    )?.state?.outgoingDirection,
    "left",
  );
});

test("激光镜注册为阻挡、可推动对象，并使用 Robo 2 双面镜视觉", () => {
  const definition = createBuiltinEntityRegistry().require(
    MapEntityTypeId.LASER_MIRROR,
  );
  assert.deepEqual(definition.presenceFacts, ["blocking", "pushable"]);
  for (const variant of ["slash", "backslash"]) {
    assert.deepEqual(
      resolveLevelEntityVisualPreview({
        type: MapEntityTypeId.LASER_MIRROR,
        variant,
      }),
      {
        layers: [{
          kind: "image",
          renderPass: "standing",
          asset: ROBO2_GAMEPLAY_IMAGE_IDS.mirror[variant],
          sourceTileSize: 48,
          anchor: "center",
        }],
      },
    );
  }
});
