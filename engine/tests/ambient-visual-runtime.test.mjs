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

test("Snow 按 Canvas 面积计算，Butterfly 按可见地图面积计算", () => {
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
  let snow = snowRuntime.scene(snowWorld).ambientForeground;
  assert.equal(snow.length, 5);
  snowRuntime.camera.setViewport(480, 640);
  snow = snowRuntime.scene(snowWorld).ambientForeground;
  assert.equal(snow.length, 20);

  const largeSnowWorld = terrainWorld(20, 20, [
    { type: MapEntityTypeId.SNOW, x: 0, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 10, y: 10 },
  ]);
  const largeSnowRuntime = new VisualRuntime(visuals, 48, {}, {
    ambient: { seed: 7 },
  });
  largeSnowRuntime.camera.setViewport(240, 320);
  largeSnowRuntime.update({ frame: 0, nowMs: 0, deltaMs: 0 }, "linear");
  snow = largeSnowRuntime.scene(largeSnowWorld).ambientForeground;
  assert.equal(snow.length, 1);
  largeSnowRuntime.camera.setViewport(480, 640);
  snow = largeSnowRuntime.scene(largeSnowWorld).ambientForeground;
  assert.equal(snow.length, 5);

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
  assertScreenItemsInsideMap(
    butterflies,
    outdoorWorld,
    butterflyRuntime.camera,
  );
});

test("Snow 使用原版素材，并按原版固定步长下落和横向抖动", () => {
  const world = terrainWorld(20, 20, [
    { type: MapEntityTypeId.SNOW, x: 0, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 10, y: 10 },
  ]);
  const runtime = new VisualRuntime(createBuiltinVisualRegistry(), 48, {}, {
    ambient: { seed: 17, snowDensity: 65 },
  });
  runtime.camera.setViewport(320, 320);
  runtime.update({ frame: 0, nowMs: 0, deltaMs: 0 }, "linear");
  const start = runtime.scene(world).ambientForeground;
  const layer = start[0].composition.layers[0];
  assert.deepEqual(
    {
      kind: layer.kind,
      asset: layer.asset,
      sourceX: layer.sourceX,
      sourceY: layer.sourceY,
      frameWidth: layer.frameWidth,
      frameHeight: layer.frameHeight,
    },
    {
      kind: "image",
      asset: "hud-atlas",
      sourceX: 338,
      sourceY: 0,
      frameWidth: 12,
      frameHeight: 8,
    },
  );

  runtime.update({ frame: 1, nowMs: 30, deltaMs: 30 }, "linear");
  assert.deepEqual(runtime.scene(world).ambientForeground, start);
  runtime.update({ frame: 2, nowMs: 31, deltaMs: 1 }, "linear");
  const moved = runtime.scene(world).ambientForeground;
  for (let index = 0; index < start.length; index += 1) {
    assert.equal(moved[index].y - start[index].y, 3);
    assert.ok([-1, 0, 1].includes(moved[index].x - start[index].x));
  }

  runtime.camera.setZoom(2);
  const zoomed = runtime.scene(world).ambientForeground;
  assert.ok(zoomed.length < moved.length);
  assert.equal(zoomed[0].size, 96);
  assert.equal(zoomed[0].x + (96 - 24) / 2, moved[0].x + (48 - 12) / 2);
  assert.equal(zoomed[0].y + (96 - 16) / 2, moved[0].y + (48 - 8) / 2);
  runtime.update({ frame: 3, nowMs: 62, deltaMs: 31 }, "linear");
  const zoomedMoved = runtime.scene(world).ambientForeground;
  for (let index = 0; index < zoomed.length; index += 1) {
    assert.equal(zoomedMoved[index].y - zoomed[index].y, 6);
    assert.ok([-2, 0, 2].includes(zoomedMoved[index].x - zoomed[index].x));
  }
});

test("Snow 使用 Canvas 屏幕空间，并以地图边界裁剪 Camera pan", () => {
  const world = new World({
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: MapEntityTypeId.SNOW, x: 0, y: 0 },
    ],
  });
  const runtime = new VisualRuntime(createBuiltinVisualRegistry(), 48, {}, {
    ambient: { seed: 23, snowDensity: 65 },
  });
  runtime.camera.setViewport(320, 320);
  runtime.update({ frame: 0, nowMs: 0, deltaMs: 0 }, "linear");
  const beforePan = runtime.scene(world).ambientForeground;

  runtime.camera.centerX += 1;
  runtime.camera.centerY += 1;

  const afterPan = runtime.scene(world).ambientForeground;
  assert.deepEqual(
    afterPan.map(withoutClip),
    beforePan.map(withoutClip),
  );
  assert.notDeepEqual(afterPan[0].clip, beforePan[0].clip);
  assert.equal(beforePan[0].clip.width, 48);
  assert.equal(beforePan[0].clip.height, 48);
});

test("纯 Sky 地图不显示蝴蝶，混合地图保留蝴蝶", () => {
  const visuals = createBuiltinVisualRegistry();
  const pureSky = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: MapEntityTypeId.STARFIELD, variant: "empty", x: 0, y: 0 },
      { type: MapEntityTypeId.MOON, variant: "ts-5-11", x: 1, y: 0 },
    ],
  });
  const runtime = new VisualRuntime(visuals, 48, {}, {
    ambient: { seed: 4, butterflyDensity: 100 },
  });
  runtime.camera.setViewport(240, 160);
  runtime.update({ frame: 0, nowMs: 0, deltaMs: 0 }, "linear");
  assert.deepEqual(runtime.scene(pureSky).ambientForeground, []);

  const mixed = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: MapEntityTypeId.STARFIELD, variant: "empty", x: 0, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
    ],
  });
  assert.ok(runtime.scene(mixed).ambientForeground.length > 0);
});

test("Butterfly 使用可复现的独立慢速航点", () => {
  const world = terrainWorld(20, 20, [
    { type: MapEntityTypeId.BOBBY, x: 10, y: 10 },
  ]);
  const createRuntime = () => {
    const runtime = new VisualRuntime(createBuiltinVisualRegistry(), 48, {}, {
      ambient: { seed: 71, butterflyDensity: 30 },
    });
    runtime.camera.setViewport(320, 320);
    return runtime;
  };
  const runtime = createRuntime();
  runtime.update({ frame: 0, nowMs: 0, deltaMs: 0 }, "linear");
  const start = runtime.scene(world).ambientForeground;
  runtime.update({ frame: 1, nowMs: 1000, deltaMs: 1000 }, "linear");
  const moved = runtime.scene(world).ambientForeground;
  assert.ok(start.length >= 2);
  assert.notDeepEqual(
    { x: moved[0].x - start[0].x, y: moved[0].y - start[0].y },
    { x: moved[1].x - start[1].x, y: moved[1].y - start[1].y },
  );
  assertScreenItemsInsideMap(moved, world, runtime.camera);

  const repeated = createRuntime();
  repeated.update({ frame: 0, nowMs: 0, deltaMs: 0 }, "linear");
  repeated.scene(world);
  repeated.update({ frame: 1, nowMs: 1000, deltaMs: 1000 }, "linear");
  assert.deepEqual(repeated.scene(world).ambientForeground, moved);
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

test("Sky shimmer 只选择没有非 Sky Presence 的格子", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: MapEntityTypeId.STARFIELD, variant: "empty", x: 0, y: 0 },
      { type: MapEntityTypeId.STARFIELD, variant: "empty", x: 1, y: 0 },
      { type: MapEntityTypeId.CARROT, x: 1, y: 0 },
    ],
  });
  const runtime = new VisualRuntime(createBuiltinVisualRegistry(), 48, {}, {
    ambient: { seed: 3 },
  });
  runtime.camera.setViewport(96, 48);
  for (let index = 0; index < 30; index += 1) {
    runtime.update({
      frame: index,
      nowMs: index * 124,
      deltaMs: 124,
    }, "linear");
    for (const shimmer of runtime.scene(world).ambientBackground)
      assert.ok(shimmer.visualX < 0.5);
  }
});

test("Snow 天气不关闭空 Sky 格的 shimmer", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: MapEntityTypeId.STARFIELD, variant: "empty", x: 0, y: 0 },
      { type: MapEntityTypeId.SNOW, x: 0, y: 0 },
      { type: MapEntityTypeId.STARFIELD, variant: "empty", x: 1, y: 0 },
    ],
  });
  const runtime = new VisualRuntime(createBuiltinVisualRegistry(), 48, {}, {
    ambient: { seed: 3 },
  });
  runtime.camera.setViewport(96, 48);
  let sawShimmer = false;
  for (let index = 0; index < 30; index += 1) {
    runtime.update({
      frame: index,
      nowMs: index * 124,
      deltaMs: 124,
    }, "linear");
    const scene = runtime.scene(world);
    assert.ok(scene.ambientForeground.length > 0);
    assert.equal(
      scene.ambientForeground[0].composition.layers[0].kind,
      "image",
    );
    sawShimmer ||= scene.ambientBackground.length > 0;
  }
  assert.equal(sawShimmer, true);
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

function terrainWorld(width, height, extraEntities = []) {
  const entities = [];
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1)
      entities.push({ type: "grass", variant: "ts-10-1", x, y });
  entities.push(...extraEntities);
  return new World({ schemaVersion: 1, width, height, entities });
}

function withoutClip({ clip: _clip, ...item }) {
  return item;
}

function assertScreenItemsInsideMap(items, world, camera) {
  const start = camera.worldToScreen(0, 0);
  const end = camera.worldToScreen(world.width, world.height);
  const left = Math.max(0, Math.min(start.x, end.x));
  const top = Math.max(0, Math.min(start.y, end.y));
  const right = Math.min(camera.viewportWidth, Math.max(start.x, end.x));
  const bottom = Math.min(camera.viewportHeight, Math.max(start.y, end.y));
  for (const item of items) {
    assert.ok(item.x >= left - 1e-9, `${item.x} >= ${left}`);
    assert.ok(item.y >= top - 1e-9, `${item.y} >= ${top}`);
    assert.ok(item.x + item.size <= right + 1e-9,
      `${item.x + item.size} <= ${right}`);
    assert.ok(item.y + item.size <= bottom + 1e-9,
      `${item.y + item.size} <= ${bottom}`);
  }
}
