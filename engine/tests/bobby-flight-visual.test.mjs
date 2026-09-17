import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../dist/entities/registry.js";
import { builtinEngineEnvironment } from "../dist/public.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";
import { SpatialVisualQuery } from "../dist/visual/SpatialVisualQuery.js";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";

function bobbyVisual(options = {}) {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
  ]);
  const spatial = new SpatialIndex(
    store,
    entities,
    1,
    1,
    builtinEngineEnvironment.facts,
  );
  const bobby = store.all().find((entity) =>
    entity.type === MapEntityTypeId.BOBBY);
  assert.ok(bobby);
  bobby.direction = options.direction ?? "right";
  if (options.state) bobby.state = structuredClone(options.state);
  const presence = spatial.presencesForEntity(bobby.id)[0];
  assert.ok(presence);
  return visuals.resolve(entities.require(MapEntityTypeId.BOBBY), {
    entity: bobby,
    presence,
    query: new SpatialVisualQuery(store, spatial),
    ...(options.runtime ? { runtime: options.runtime } : {}),
  });
}

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

test("Flight 起飞先分阶段上抬普通 Bobby，抵达后切换风筝素材", () => {
  const beforeLift = bobbyVisual({
    direction: "right",
    state: { flightTransition: "takeoff" },
    runtime: { moving: true, progress: 0.5 },
  });
  assert.equal(beforeLift.layers[0].asset, "bobby-right");
  assert.equal(beforeLift.layers[0].offsetY, -12);

  const liftStages = [
    [0.5625, -18],
    [0.625, -24],
    [0.75, -36],
    [0.875, -48],
    [0.9375, -54],
  ];
  for (const [progress, offsetY] of liftStages) {
    const takeoff = bobbyVisual({
      direction: "right",
      state: { flightTransition: "takeoff" },
      runtime: { moving: true, progress },
    });
    assert.equal(takeoff.layers[0].asset, "bobby-right");
    assert.equal(takeoff.layers[0].offsetY, offsetY);
  }

  const airborne = bobbyVisual({
    direction: "right",
    state: { flying: true },
    runtime: { moving: true, progress: 0.25 },
  });
  assert.equal(airborne.layers[0].asset, "bobby-kite");
  assert.equal(airborne.layers[0].offsetY, -36);
});

test("Speed 快速入格时 Flight 起飞使用四阶段上抬", () => {
  const fastStages = [
    [0.5, -12],
    [0.625, -18],
    [0.75, -24],
    [0.875, -30],
  ];
  for (const [progress, offsetY] of fastStages) {
    const takeoff = bobbyVisual({
      direction: "right",
      state: { flightTransition: "takeoff" },
      runtime: { moving: true, progress, animation: "speed" },
    });
    assert.equal(takeoff.layers[0].asset, "bobby-right");
    assert.equal(takeoff.layers[0].offsetY, offsetY);
  }
});

test("Flight Landing 在后半格保持风筝素材并分四阶段下降", () => {
  const landingStages = [
    [0.5, -36],
    [0.625, -30],
    [0.75, -24],
    [0.875, -18],
  ];
  for (const [progress, offsetY] of landingStages) {
    const landing = bobbyVisual({
      direction: "right",
      state: { flying: true, flightTransition: "landing" },
      runtime: { moving: true, progress },
    });
    assert.equal(landing.layers[0].asset, "bobby-kite");
    assert.equal(landing.layers[0].offsetY, offsetY);
  }

  const landed = bobbyVisual({
    direction: "right",
    runtime: { moving: false, progress: 1 },
  });
  assert.equal(landed.layers[0].asset, "bobby-right");
  assert.equal(landed.layers[0].offsetY, -12);
});

test("Flight 上抬在不同 Presentation 采样频率的同一毫秒得到相同结果", () => {
  const sample = (hz) => {
    const runtime = new VisualRuntime(createBuiltinVisualRegistry());
    runtime.beginMove(
      7,
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      350,
      { frame: 0, nowMs: 0, deltaMs: 0 },
    );
    const intervalMs = 1000 / hz;
    let nowMs = intervalMs;
    let frame = 1;
    while (nowMs < 262.5) {
      runtime.update({ frame, nowMs, deltaMs: intervalMs }, "linear");
      nowMs += intervalMs;
      frame += 1;
    }
    runtime.update(
      { frame, nowMs: 262.5, deltaMs: intervalMs },
      "linear",
    );
    const visualState = runtime.runtimeStates.get(7);
    assert.ok(visualState);
    return bobbyVisual({
      direction: "right",
      state: { flightTransition: "takeoff" },
      runtime: visualState,
    }).layers[0];
  };

  for (const hz of [30, 60, 144]) {
    const layer = sample(hz);
    assert.equal(layer.asset, "bobby-right");
    assert.equal(layer.offsetY, -36);
  }
});
