import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { createBuiltinVisualRegistry } from "../dist/entities/registry.js";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";
import { World } from "./support/World.mjs";

test("开启的 Windmill 从中心沿方向绘制三格同相风场", () => {
  const windmills = [
    { type: MapEntityTypeId.WINDMILL, x: 2, y: 4, direction: "up" },
    { type: MapEntityTypeId.WINDMILL, x: 4, y: 2, direction: "down" },
    { type: MapEntityTypeId.WINDMILL, x: 4, y: 4, direction: "left" },
    { type: MapEntityTypeId.WINDMILL, x: 1, y: 1, direction: "right" },
  ];
  const switches = ["up", "down", "left", "right"].map((direction) => ({
    type: MapEntityTypeId.WIND_SWITCH,
    x: 0,
    y: 0,
    direction,
    active: true,
  }));
  const world = new World({
    schemaVersion: 1,
    width: 7,
    height: 7,
    entities: [...windmills, ...switches],
  });
  const runtime = new VisualRuntime(createBuiltinVisualRegistry());
  runtime.update({ frame: 0, nowMs: 0, deltaMs: 0 }, "linear");

  const start = runtime.scene(world).worldEffect;
  assert.equal(start.length, 4);
  const expectedOffsets = {
    up: [[0, -24], [0, -72], [0, -120]],
    down: [[0, 24], [0, 72], [0, 120]],
    left: [[-24, 0], [-72, 0], [-120, 0]],
    right: [[24, 0], [72, 0], [120, 0]],
  };
  for (const [direction, offsets] of Object.entries(expectedOffsets)) {
    const layers = windLayers(start, world, direction);
    assert.deepEqual(
      layers.map(({ offsetX, offsetY }) => [offsetX, offsetY]),
      offsets,
    );
    const frame = direction === "up" || direction === "down" ? 52 : 55;
    assert.deepEqual(
      layers.map(({ frameIndex }) => frameIndex),
      [frame, frame, frame],
    );
  }

  runtime.update({ frame: 1, nowMs: 124, deltaMs: 124 }, "linear");
  const next = runtime.scene(world).worldEffect;
  for (const direction of ["up", "down", "left", "right"]) {
    const frame = direction === "up" || direction === "down" ? 53 : 56;
    assert.deepEqual(
      windLayers(next, world, direction).map(({ frameIndex }) => frameIndex),
      [frame, frame, frame],
    );
  }
  for (const item of next) {
    for (const layer of item.composition.layers) {
      assert.equal(layer.asset, "original-animated-tiles");
      assert.equal(layer.frameWidth, 48);
      assert.equal(layer.frameHeight, 48);
      assert.equal(layer.anchor, "center");
      assert.equal(layer.renderPass, "world-effect");
    }
  }
});

test("关闭的 Windmill 保持静态且不绘制风场", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: MapEntityTypeId.WINDMILL, x: 0, y: 0, direction: "right" },
      {
        type: MapEntityTypeId.WIND_SWITCH,
        x: 1,
        y: 0,
        direction: "right",
        active: false,
      },
    ],
  });
  const runtime = new VisualRuntime(createBuiltinVisualRegistry());
  runtime.update({ frame: 1, nowMs: 124, deltaMs: 124 }, "linear");
  const scene = runtime.scene(world);
  assert.deepEqual(scene.standing, []);
  const windmill = scene.world.find(
    (item) => world.entity(item.presence.entityId)?.type === MapEntityTypeId.WINDMILL,
  );
  assert.ok(windmill);
  assert.equal(windmill.composition.layers[0].kind, "atlas");
});

function windLayers(items, world, direction) {
  const item = items.find(
    (candidate) => world.entity(candidate.presence.entityId)?.direction === direction,
  );
  assert.ok(item);
  return item.composition.layers;
}
