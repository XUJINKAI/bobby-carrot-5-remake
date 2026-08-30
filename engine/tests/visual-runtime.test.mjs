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
import { resolveEntityVisualPreview } from "../dist/visual/preview.js";

function bobbyVisual(options = {}) {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
    {
      type: EntityTypeId.BOBBY,
      x: 0,
      y: 0,
      direction: options.direction ?? "right",
    },
  ]);
  const spatial = new SpatialIndex(store, entities, 1, 1);
  const bobby = store.all().find((entity) => entity.type === EntityTypeId.BOBBY);
  assert.ok(bobby);
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

test("Bobby authoring preview uses the final b3 frame at the raised source offset", () => {
  const composition = resolveEntityVisualPreview({
    type: EntityTypeId.BOBBY,
    direction: "left",
  });
  assert.deepEqual(composition, {
    layers: [
      {
        kind: "image",
        asset: "bobby-down",
        frameColumns: 8,
        frameRows: 1,
        frameIndex: 7,
        anchor: "bottom",
        offsetY: -12,
      },
    ],
  });
});

test("world entities stay below Bobby regardless of cover stackOrder", () => {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  assert.equal(visuals.renderPassFor(entities.require(EntityTypeId.ICE_BLOCK)), "world");
  assert.equal(visuals.renderPassFor(entities.require(EntityTypeId.HIGH_GRASS)), "world");
  assert.equal(visuals.renderPassFor(entities.require(EntityTypeId.SNOW)), "world");
  assert.equal(visuals.renderPassFor(entities.require(EntityTypeId.BOBBY)), "player");
});

test("Bobby walking progress drives one eight-frame directional strip", () => {
  const composition = bobbyVisual({
    runtime: { offsetX: -0.5, moving: true, progress: 0.5 },
  });
  assert.deepEqual(composition.layers[0], {
    kind: "image",
    asset: "bobby-right",
    frameColumns: 8,
    frameRows: 1,
    frameProgress: 0.5,
    anchor: "bottom",
    offsetY: -12,
  });
});

test("Bobby idle switches to the three-frame b4 strip only after five seconds", () => {
  const before = bobbyVisual({
    runtime: { moving: false, progress: 1, stationarySinceMs: 1000 },
    time: { frame: 299, nowMs: 5999, deltaMs: 16.6667 },
  });
  assert.equal(before.layers[0].asset, "bobby-right");
  assert.equal(before.layers[0].frameIndex, 7);

  const idle = bobbyVisual({
    runtime: { moving: false, progress: 1, stationarySinceMs: 1000 },
    time: { frame: 300, nowMs: 6000, deltaMs: 16.6667 },
  });
  assert.equal(idle.layers[0].asset, "bobby-idle");
  assert.equal(idle.layers[0].frameColumns, 3);
  assert.equal(idle.layers[0].frameIndex, 0);
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
    global: { ridingMower: true },
    time: { frame: 1, nowMs: 16.6667, deltaMs: 16.6667 },
  });
  assert.equal(mower.layers[0].asset, "bobby-mower");
  assert.equal(mower.layers[0].frameColumns, 4);
  assert.equal(mower.layers[0].frameRows, 2);
  assert.equal(mower.layers[0].frameIndex, 6);
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
    global: { forced: { kind: "flight", direction: "left" } },
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

test("motion duration remains 132ms and is independent from WorldClock rate", () => {
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
