import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { AmbientVisualRuntime } from "../dist/visual/ambient/AmbientVisualRuntime.js";
import { densityCount } from "../dist/visual/ambient/AmbientVisualRuntime.js";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";
import { createBuiltinEntityRegistry, createBuiltinVisualRegistry } from "../dist/entities/registry.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";
import { SpatialVisualQuery } from "../dist/visual/SpatialVisualQuery.js";
import { builtinEngineEnvironment } from "../dist/public.js";
import { World } from "./support/World.mjs";

test("Bonus Coin 共用 1/8 gate，并以 124ms 播放三帧闪光", () => {
  const runtime = new AmbientVisualRuntime({ seed: 1 });
  const sequence = [];
  for (let slot = 0; slot < 40; slot += 1) {
    runtime.update({ frame: slot, nowMs: slot * 124, deltaMs: 124 });
    sequence.push(runtime.state.bonusCoinSparkleFrame);
  }
  const start = sequence.findIndex((frame) => frame === 0);
  assert.ok(start >= 0);
  assert.deepEqual(sequence.slice(start, start + 4), [0, 1, 2, null]);

  const sameSeed = new AmbientVisualRuntime({ seed: 1 });
  const repeated = [];
  for (let slot = 0; slot < 40; slot += 1) {
    sameSeed.update({ frame: slot, nowMs: slot * 124, deltaMs: 124 });
    repeated.push(sameSeed.state.bonusCoinSparkleFrame);
  }
  assert.deepEqual(repeated, sequence);
});

test("Snow 与 Butterfly 数量按 CSS 视窗面积和密度计算", () => {
  assert.equal(densityCount(240, 320, 65), 5);
  assert.equal(densityCount(480, 640, 65), 20);
  assert.equal(densityCount(240, 320, 13), 1);
  assert.equal(densityCount(480, 640, 13), 4);

  const visuals = createBuiltinVisualRegistry();
  const snowWorld = new World({
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: MapEntityTypeId.SNOW, x: 0, y: 0 },
    ],
  });
  const snowRuntime = new VisualRuntime(visuals, 48, {}, {
    ambient: { seed: 7, snowDensity: 65, butterflyDensity: 13 },
  });
  snowRuntime.camera.setViewport(240, 320);
  snowRuntime.update({ frame: 0, nowMs: 0, deltaMs: 0 }, "linear");
  assert.equal(snowRuntime.scene(snowWorld).ambientForeground.length, 5);
  snowRuntime.camera.setViewport(480, 640);
  assert.equal(snowRuntime.scene(snowWorld).ambientForeground.length, 20);

  const outdoorWorld = new World({
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [{ type: "grass", variant: "ts-10-1", x: 0, y: 0 }],
  });
  const butterflyRuntime = new VisualRuntime(visuals, 48, {}, {
    ambient: { seed: 7, snowDensity: 65, butterflyDensity: 13 },
  });
  butterflyRuntime.camera.setViewport(240, 320);
  butterflyRuntime.update({ frame: 0, nowMs: 0, deltaMs: 0 }, "linear");
  const butterflies = butterflyRuntime.scene(outdoorWorld).ambientForeground;
  assert.equal(butterflies.length, 1);
  assert.equal(butterflies[0].composition.layers[0].asset, "ambient-butterfly");
});

test("Gameplay Sky shimmer 复用 Title 的 ta.png 切片", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 2,
    entities: [
      { type: MapEntityTypeId.STARFIELD, variant: "empty", x: 0, y: 0 },
      { type: MapEntityTypeId.STARFIELD, variant: "empty", x: 1, y: 0 },
      { type: MapEntityTypeId.STARFIELD, variant: "empty", x: 0, y: 1 },
      { type: MapEntityTypeId.STARFIELD, variant: "empty", x: 1, y: 1 },
    ],
  });
  const runtime = new VisualRuntime(createBuiltinVisualRegistry(), 48, {}, {
    ambient: { seed: 3 },
  });
  runtime.camera.setViewport(96, 96);
  let shimmer = null;
  for (let index = 0; index < 20 && !shimmer; index += 1) {
    const frame = { frame: index, nowMs: index * 124, deltaMs: 124 };
    runtime.update(frame, "linear");
    shimmer = runtime.scene(world).ambientBackground[0] ?? null;
  }
  assert.ok(shimmer);
  const layer = shimmer.composition.layers[0];
  assert.equal(layer.asset, "original-animated-tiles");
  assert.equal(layer.frameWidth, 16);
  assert.equal(layer.frameHeight, 16);
});

test("所有 Bonus Coin 读取同一共享闪光帧", () => {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    { type: MapEntityTypeId.BONUS_COIN, x: 0, y: 0 },
    { type: MapEntityTypeId.BONUS_COIN, x: 1, y: 0 },
  ]);
  const spatial = new SpatialIndex(
    store,
    entities,
    2,
    1,
    builtinEngineEnvironment.facts,
  );
  const query = new SpatialVisualQuery(store, spatial);
  const layers = store.all().map((coin) => visuals.resolve(
    entities.require(coin.type),
    {
      entity: coin,
      presence: spatial.presencesForEntity(coin.id)[0],
      query,
      time: { frame: 1, nowMs: 124, deltaMs: 124 },
      ambient: { bonusCoinSparkleFrame: 1 },
    },
  ).layers[0]);
  assert.deepEqual(layers[0], layers[1]);
  assert.equal(layers[0].frameIndex, 16);
});
