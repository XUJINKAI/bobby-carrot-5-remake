import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../../../engine/dist/entities/registry.js";
import { builtinEngineEnvironment } from "../../../engine/dist/public.js";
import { EntityStore } from "../../../engine/dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../../../engine/dist/world/spatial/SpatialIndex.js";
import { SpatialVisualQuery } from "../../../engine/dist/visual/SpatialVisualQuery.js";
import { VisualRuntime } from "../../../engine/dist/visual/VisualRuntime.js";
import { World } from "../../support/engine/World.mjs";

const factRegistry = builtinEngineEnvironment.facts;

function bobbyVisualOnIce(options = {}) {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    { type: MapEntityTypeId.ICE, x: 0, y: 0 },
    ...(options.mounted
      ? [{ type: MapEntityTypeId.MOWER, x: 0, y: 0 }]
      : []),
    { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
  ]);
  const spatial = new SpatialIndex(store, entities, 1, 1, factRegistry);
  const bobby = store.all().find((entity) =>
    entity.type === MapEntityTypeId.BOBBY
  );
  assert.ok(bobby);
  bobby.direction = options.direction ?? "right";
  if (options.mounted) bobby.state = { mountId: 2 };
  const presence = spatial.presencesForEntity(bobby.id)[0];
  assert.ok(presence);
  return visuals.resolve(entities.require(MapEntityTypeId.BOBBY), {
    entity: bobby,
    presence,
    query: new SpatialVisualQuery(store, spatial),
    ...(options.runtime ? { runtime: options.runtime } : {}),
    ...(options.time ? { time: options.time } : {}),
  });
}

test("Bobby Ice slide stays on movement frame seven", () => {
  const composition = bobbyVisualOnIce({
    direction: "left",
    runtime: {
      offsetX: 0.5,
      moving: true,
      progress: 0.5,
      animation: "ice",
      direction: "left",
    },
  });
  assert.deepEqual(composition.layers[0], {
    kind: "image",
    asset: "bobby-left",
    frameColumns: 8,
    frameRows: 1,
    frameIndex: 6,
    anchor: "bottom",
    offsetY: -12,
  });
});

test("Bobby switches from walking to the Ice slide pose at movement midpoint", () => {
  const walking = bobbyVisualOnIce({
    runtime: {
      offsetX: -0.75,
      moving: true,
      progress: 0.25,
      direction: "right",
    },
  });
  const sliding = bobbyVisualOnIce({
    runtime: {
      offsetX: -0.25,
      moving: true,
      progress: 0.75,
      direction: "right",
    },
  });

  assert.equal(walking.layers[0].asset, "bobby-right");
  assert.equal(walking.layers[0].frameIndex, 5);
  assert.equal(sliding.layers[0].asset, "bobby-right");
  assert.equal(sliding.layers[0].frameIndex, 6);
});

test("Mower keeps a stationary vehicle visual after entering Ice", () => {
  const visualAt = (nowMs) => bobbyVisualOnIce({
    mounted: true,
    runtime: {
      offsetX: -0.25,
      moving: true,
      progress: 0.75,
      direction: "right",
      animationStartedAtMs: 1000,
    },
    time: { frame: nowMs, nowMs, deltaMs: 0 },
  }).layers.at(-1);

  const first = visualAt(1000);
  const second = visualAt(1062);
  assert.equal(first.asset, "bobby-mower");
  assert.equal(second.asset, "bobby-mower");
  assert.equal(first.sourceY, second.sourceY);
});

test("Bobby uses the normal standing frame while stationary on Ice", () => {
  const composition = bobbyVisualOnIce({
    runtime: {
      offsetX: 0,
      moving: false,
      progress: 1,
      direction: "right",
      stationarySinceMs: 1000,
    },
  });
  assert.equal(composition.layers[0].asset, "bobby-right");
  assert.equal(composition.layers[0].frameIndex, 3);
});

test("World-backed Ice motion holds its moving pose until authoritative handoff", () => {
  const runtime = new VisualRuntime(createBuiltinVisualRegistry());
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: MapEntityTypeId.ICE, x: 1, y: 0 },
      { type: MapEntityTypeId.ICE, x: 2, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 1, y: 0, direction: "right" },
    ],
  });
  const actor = world.query.entitiesWithFact("player")[0];
  const first = {
    id: 1,
    kind: "move",
    entityId: actor.id,
    from: { x: 0, y: 0 },
    to: { x: 1, y: 0 },
    direction: "right",
    cause: { type: "forced", mechanism: "ice", cadenceMs: 100 },
    durationMs: 100,
    elapsedMs: 0,
    progress: 0,
    status: "running",
  };
  const options = {
    motionDuration: (motion) => motion.durationMs,
    stationaryDeathDurationMs: 100,
  };

  runtime.consumeWorldDeltas(
    world,
    [{
      sequence: 1,
      worldTick: 1,
      worldTimeMs: 0,
      type: "motion-started",
      motion: first,
    }],
    { frame: 0, nowMs: 1000, deltaMs: 0 },
    options,
  );
  runtime.update({ frame: 1, nowMs: 1100, deltaMs: 100 }, "linear");

  const awaitingHandoff = runtime.inspectEntity(world, actor.id).runtime;
  assert.equal(awaitingHandoff.moving, true);
  assert.equal(awaitingHandoff.animation, "ice");
  assert.equal(awaitingHandoff.progress, 1);

  const second = {
    ...first,
    id: 2,
    from: { x: 1, y: 0 },
    to: { x: 2, y: 0 },
  };
  runtime.consumeWorldDeltas(
    world,
    [
      {
        sequence: 2,
        worldTick: 2,
        worldTimeMs: 100,
        type: "motion-completed",
        motion: { ...first, elapsedMs: 100, progress: 1, status: "completed" },
      },
      {
        sequence: 3,
        worldTick: 2,
        worldTimeMs: 100,
        type: "motion-started",
        motion: second,
      },
    ],
    { frame: 1, nowMs: 1100, deltaMs: 0 },
    options,
  );

  const continued = runtime.inspectEntity(world, actor.id).runtime;
  assert.equal(continued.moving, true);
  assert.equal(continued.animation, "ice");
  assert.equal(continued.progress, 0);
});
