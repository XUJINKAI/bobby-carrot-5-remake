import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";
import { SpatialVisualQuery } from "../dist/visual/SpatialVisualQuery.js";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";
import {
  builtinEntityModules,
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../dist/entities/registry.js";

function bobbyVisual(options = {}) {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const mountType = options.mountType;
  const state = mountType
    ? { ...(options.state ?? {}), mountId: 2 }
    : options.state;
  const store = new EntityStore([
    { type: options.surfaceType ?? EntityTypeId.GROUND_C, x: 0, y: 0 },
    ...(mountType ? [{ type: mountType, x: 0, y: 0 }] : []),
    {
      type: EntityTypeId.BOBBY,
      x: 0,
      y: 0,

    },
  ]);
  const spatial = new SpatialIndex(store, entities, 1, 1);
  const bobby = store.all().find((entity) => entity.type === EntityTypeId.BOBBY);
  assert.ok(bobby);
  bobby.direction = options.direction ?? "right";
  if (state) bobby.state = structuredClone(state);
  const presence = spatial.presencesForEntity(bobby.id)[0];
  assert.ok(presence);
  return visuals.resolve(entities.require(EntityTypeId.BOBBY), {
    entity: bobby,
    presence,
    query: new SpatialVisualQuery(store, spatial),
    ...(options.runtime ? { runtime: options.runtime } : {}),
    ...(options.global ? { global: options.global } : {}),
    ...(options.time ? { time: options.time } : {}),
  });
}

test("world entities stay below Bobby regardless of cover stackOrder", () => {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  assert.equal(
    visuals.renderPassFor(entities.require(EntityTypeId.ICE_BLOCK)),
    "world",
  );
  assert.equal(
    visuals.renderPassFor(entities.require(EntityTypeId.HIGH_GRASS)),
    "world",
  );
  assert.equal(
    visuals.renderPassFor(entities.require(EntityTypeId.SNOW)),
    "world",
  );
  assert.equal(
    visuals.renderPassFor(entities.require(EntityTypeId.BOBBY)),
    "player",
  );
});

test("Bobby walking loops from movement frame four back to frame four", () => {
  const start = bobbyVisual({
    runtime: { offsetX: -1, moving: true, progress: 0 },
  });
  const middle = bobbyVisual({
    runtime: { offsetX: -0.5, moving: true, progress: 0.5 },
  });
  const end = bobbyVisual({
    runtime: { offsetX: 0, moving: true, progress: 1 },
  });
  assert.equal(start.layers[0].frameIndex, 3);
  assert.deepEqual(middle.layers[0], {
    kind: "image",
    asset: "bobby-right",
    frameColumns: 8,
    frameRows: 1,
    frameIndex: 7,
    anchor: "bottom",
    offsetY: -12,
  });
  assert.equal(end.layers[0].frameIndex, 3);
});

test("Bobby Ice slide stays on movement frame seven", () => {
  const composition = bobbyVisual({
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

test("Bobby keeps Ice frame seven while waiting between consecutive Ice cells", () => {
  const composition = bobbyVisual({
    surfaceType: EntityTypeId.ICE,
    direction: "right",
    runtime: {
      offsetX: 0,
      moving: false,
      progress: 1,
      direction: "right",
      stationarySinceMs: 1000,
    },
  });
  assert.equal(composition.layers[0].asset, "bobby-right");
  assert.equal(composition.layers[0].frameIndex, 6);
});

test("Bobby idle starts after five seconds and advances every 50ms", () => {
  const runtime = { moving: false, progress: 1, stationarySinceMs: 1000 };
  const before = bobbyVisual({
    runtime,
    time: { frame: 299, nowMs: 5999, deltaMs: 16.6667 },
  });
  assert.equal(before.layers[0].asset, "bobby-right");
  assert.equal(before.layers[0].frameIndex, 3);

  for (const [nowMs, expectedFrame] of [
    [6000, 0],
    [6050, 1],
    [6100, 2],
    [6150, 0],
  ]) {
    const idle = bobbyVisual({
      runtime,
      time: { frame: 300, nowMs, deltaMs: 50 },
    });
    assert.equal(idle.layers[0].asset, "bobby-idle");
    assert.equal(idle.layers[0].frameColumns, 3);
    assert.equal(idle.layers[0].frameIndex, expectedFrame);
  }
});

test("Bobby death uses the eight-frame b5 strip and keeps its final frame", () => {
  const death = bobbyVisual({
    runtime: { moving: false, progress: 1, animation: "death" },
    global: { dead: true },
  });
  assert.equal(death.layers[0].asset, "bobby-death");
  assert.equal(death.layers[0].frameColumns, 8);
  assert.equal(death.layers[0].frameIndex, 7);
  assert.equal(death.layers[0].frameProgress, undefined);
});

test("Bobby mower cycles vertically inside the direction column", () => {
  const mower = bobbyVisual({
    direction: "up",
    mountType: EntityTypeId.MOWER,
    time: { frame: 1, nowMs: 16.6667, deltaMs: 16.6667 },
  });
  assert.equal(mower.layers[0].asset, "bobby-mower");
  assert.equal(mower.layers[0].frameColumns, 4);
  assert.equal(mower.layers[0].frameRows, 2);
  assert.equal(mower.layers[0].frameIndex, 6);
});

test("mow.png trail stays one cell behind and only covers the first 1.5 off-belt cells", () => {
  const full = bobbyVisual({
    direction: "right",
    state: { speedBoost: { direction: "right", phase: "full" } },
    runtime: {
      offsetX: -0.5,
      moving: true,
      progress: 0.5,
      animation: "speed",
      direction: "right",
    },
    time: { frame: 14, nowMs: 240, deltaMs: 16 },
  });
  assert.deepEqual(full.layers[0], {
    kind: "image",
    asset: "bobby-speed-trail",
    frameColumns: 5,
    frameRows: 2,
    frameIndex: 8,
    anchor: "bottom",
    offsetX: -48,
    offsetY: -12,
  });
  assert.equal(full.layers[1].asset, "bobby-right");

  const normalFirstHalf = bobbyVisual({
    direction: "up",
    state: { speedBoost: { direction: "up", phase: "normal" } },
    runtime: {
      offsetY: 0.51,
      moving: true,
      progress: 0.75,
      animation: "speed",
      direction: "up",
    },
    time: { frame: 14, nowMs: 240, deltaMs: 16 },
  });
  assert.equal(normalFirstHalf.layers[0].asset, "bobby-speed-trail");
  assert.equal(normalFirstHalf.layers[0].offsetX, 0);
  assert.equal(normalFirstHalf.layers[0].offsetY, 36);

  const normalSecondHalf = bobbyVisual({
    state: { speedBoost: { direction: "right", phase: "normal" } },
    runtime: {
      offsetX: -0.5,
      moving: true,
      progress: 0.25,
      animation: "speed",
      direction: "right",
    },
    time: { frame: 14, nowMs: 240, deltaMs: 16 },
  });
  assert.equal(normalSecondHalf.layers.length, 1);
  assert.equal(normalSecondHalf.layers[0].asset, "bobby-right");

  const slow = bobbyVisual({
    state: { speedBoost: { direction: "right", phase: "slow" } },
    runtime: {
      offsetX: -0.9,
      moving: true,
      progress: 0.1,
      animation: "speed",
      direction: "right",
    },
    time: { frame: 14, nowMs: 240, deltaMs: 16 },
  });
  assert.equal(slow.layers.length, 1);
});

test("accelerated mower uses the same one-cell-behind trail", () => {
  const mower = bobbyVisual({
    direction: "left",
    mountType: EntityTypeId.MOWER,
    state: {
      speedBoost: { direction: "left", phase: "full" },
    },
    runtime: {
      offsetX: 0.75,
      moving: true,
      progress: 0.25,
      animation: "speed",
      direction: "left",
    },
    time: { frame: 14, nowMs: 240, deltaMs: 16 },
  });
  assert.equal(mower.layers[0].asset, "bobby-speed-trail");
  assert.equal(mower.layers[0].offsetX, 48);
  assert.equal(mower.layers[0].offsetY, -12);
  assert.equal(mower.layers[1].asset, "bobby-mower");
});

test("Bobby snowplow uses three rows inside the attempted direction column", () => {
  const shovel = bobbyVisual({
    runtime: {
      moving: false,
      progress: 0.5,
      animation: "shovel",
      direction: "down",
    },
  });
  assert.equal(shovel.layers[0].asset, "bobby-snowplow");
  assert.equal(shovel.layers[0].frameColumns, 4);
  assert.equal(shovel.layers[0].frameRows, 3);
  assert.equal(shovel.layers[0].frameIndex, 7);
});

test("Bobby glider selects one of four direction columns", () => {
  const flight = bobbyVisual({
    direction: "left",
    state: { flying: true },
  });
  assert.equal(flight.layers[0].asset, "bobby-kite");
  assert.equal(flight.layers[0].frameColumns, 4);
  assert.equal(flight.layers[0].frameRows, 1);
  assert.equal(flight.layers[0].frameIndex, 0);
});

test("VisualRuntime motion interpolation follows PresentationFrame milliseconds", () => {
  const runtime = new VisualRuntime(createBuiltinVisualRegistry());
  runtime.beginMove(
    7,
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    100,
    { frame: 10, nowMs: 1000, deltaMs: 16 },
  );
  assert.equal(runtime.isAnimating, true);
  runtime.update({ frame: 11, nowMs: 1050, deltaMs: 50 }, "linear");
  assert.equal(runtime.isAnimating, true);
  runtime.update({ frame: 12, nowMs: 1100, deltaMs: 50 }, "linear");
  assert.equal(runtime.isAnimating, false);
});

test("mechanism-tagged spatial motion remains moving for Speed walking animation", () => {
  const runtime = new VisualRuntime(createBuiltinVisualRegistry());
  runtime.beginMove(
    7,
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    175,
    { frame: 0, nowMs: 1000, deltaMs: 0 },
    { animation: "speed", direction: "right" },
  );
  runtime.update({ frame: 1, nowMs: 1080, deltaMs: 80 }, "linear");
  const state = runtime.inspectEntity(
    { definition: () => ({ type: EntityTypeId.BOBBY }) },
    7,
  ).runtime;
  assert.equal(state.moving, true);
  assert.equal(state.animation, "speed");
  assert.ok(state.progress > 0 && state.progress < 1);
});

test("completed motion stamps stationarySinceMs only once", () => {
  const runtime = new VisualRuntime(createBuiltinVisualRegistry());
  const world = { definition: () => ({ type: EntityTypeId.BOBBY }) };
  runtime.beginMove(
    7,
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    100,
    { frame: 0, nowMs: 1000, deltaMs: 0 },
  );
  runtime.update({ frame: 1, nowMs: 1100, deltaMs: 100 }, "linear");
  assert.equal(runtime.inspectEntity(world, 7).runtime.stationarySinceMs, 1100);

  runtime.update({ frame: 2, nowMs: 2100, deltaMs: 1000 }, "linear");
  runtime.update({ frame: 3, nowMs: 6100, deltaMs: 4000 }, "linear");
  assert.equal(runtime.inspectEntity(world, 7).runtime.stationarySinceMs, 1100);
});

test("completed presentation motion can be rewound and replayed without changing World", () => {
  const runtime = new VisualRuntime(createBuiltinVisualRegistry());
  runtime.beginMove(
    7,
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    100,
    { frame: 0, nowMs: 1000, deltaMs: 0 },
  );
  runtime.update({ frame: 6, nowMs: 1100, deltaMs: 100 }, "linear");
  assert.equal(runtime.isAnimating, false);
  runtime.update({ frame: 3, nowMs: 1050, deltaMs: -50 }, "linear");
  assert.equal(runtime.isAnimating, true);
  runtime.update({ frame: 6, nowMs: 1100, deltaMs: 50 }, "linear");
  assert.equal(runtime.isAnimating, false);
});

test("hazard death presentation stops forty percent into the target cell", () => {
  const runtime = new VisualRuntime(createBuiltinVisualRegistry());
  runtime.beginDeath(
    7,
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    100,
    { frame: 0, nowMs: 1000, deltaMs: 0 },
    0.4,
  );
  runtime.update({ frame: 6, nowMs: 1100, deltaMs: 100 }, "linear");
  const state = runtime.inspectEntity(
    {
      definition: () => ({ type: EntityTypeId.BOBBY }),
    },
    7,
  ).runtime;
  assert.equal(state.offsetX, -0.6);
  assert.equal(state.progress, 1);
  assert.equal(runtime.isAnimating, false);
});

test("WorldDelta interruption drives death presentation at authoritative progress", () => {
  const runtime = new VisualRuntime(createBuiltinVisualRegistry());
  const world = {
    entity: () => ({ id: 7, anchor: { x: 1, y: 0 } }),
    definition: () => ({ type: EntityTypeId.BOBBY }),
  };
  const motion = {
    id: 1,
    kind: "move",
    entityId: 7,
    from: { x: 0, y: 0 },
    to: { x: 1, y: 0 },
    direction: "right",
    cause: { type: "player-input", source: "test" },
    durationMs: 100,
    elapsedMs: 50,
    progress: 0.5,
    status: "interrupted",
    interruption: { reason: "trap" },
  };
  runtime.consumeWorldDeltas(
    world,
    [
      {
        sequence: 1,
        worldTick: 1,
        worldTimeMs: 50,
        type: "actor-lifecycle-changed",
        actor: {
          entityId: 7,
          phase: "downed",
          reason: "trap",
          changedAtMs: 50,
        },
      },
      {
        sequence: 2,
        worldTick: 1,
        worldTimeMs: 50,
        type: "motion-interrupted",
        motion,
      },
    ],
    { frame: 0, nowMs: 1000, deltaMs: 0 },
    { motionDuration: () => 100, stationaryDeathDurationMs: 100 },
  );
  runtime.update({ frame: 1, nowMs: 1100, deltaMs: 100 }, "linear");
  const state = runtime.inspectEntity(world, 7).runtime;
  assert.equal(state.animation, "death");
  assert.equal(state.offsetX, -0.5);
});

test("explicit presentation motion duration is independent from WorldClock rate", () => {
  const runtime = new VisualRuntime(createBuiltinVisualRegistry());
  runtime.beginMove(
    7,
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    132,
    { frame: 0, nowMs: 2000, deltaMs: 0 },
  );
  runtime.update({ frame: 1, nowMs: 2125, deltaMs: 125 }, "linear");
  assert.equal(runtime.isAnimating, true);
  runtime.update({ frame: 2, nowMs: 2132, deltaMs: 7 }, "linear");
  assert.equal(runtime.isAnimating, false);
});

test("builtin Entity modules own their visual definitions beside gameplay definitions", () => {
  assert.ok(builtinEntityModules.length > 0);
  for (const module of builtinEntityModules) {
    assert.equal(
      module.visual?.id,
      module.presentation.visual ?? module.definition.type,
    );
  }
});