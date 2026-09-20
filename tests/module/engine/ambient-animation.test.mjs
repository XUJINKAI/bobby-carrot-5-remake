import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { RuntimeEntityTypeId } from "../../../engine/dist/entities/runtime-types.js";
import {
  FIREBALL_MOVEMENT,
} from "../../../engine/dist/entities/movement/MovementCadence.js";
import {
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../../../engine/dist/entities/registry.js";
import { builtinEngineEnvironment } from "../../../engine/dist/public.js";
import { SpatialVisualQuery } from "../../../engine/dist/visual/SpatialVisualQuery.js";
import { EntityStore } from "../../../engine/dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../../../engine/dist/world/spatial/SpatialIndex.js";

const AMBIENT_STEP_MS = 124;
const factRegistry = builtinEngineEnvironment.facts;

function resolveAt(type, nowMs, direction, winState, variant, extraEntities = []) {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    {
      type,
      x: 0,
      y: 0,
      ...(direction ? { direction } : {}),
      ...(variant ? { variant } : {}),
    },
    ...extraEntities,
  ]);
  const spatial = new SpatialIndex(store, entities, 1, 1, factRegistry);
  const entity = store.all()[0];
  assert.ok(entity);
  const presence = spatial.presencesForEntity(entity.id)[0];
  assert.ok(presence);
  const composition = visuals.resolve(entities.require(type), {
    entity,
    presence,
    query: new SpatialVisualQuery(store, spatial),
    ...(winState !== undefined ? { winState } : {}),
    time: { frame: 1, nowMs, deltaMs: 16 },
  });
  assert.ok(composition);
  const layer = composition.layers[0];
  assert.ok(layer);
  return layer;
}

function expectAnimated(type, frameIndex, direction, variant) {
  const extraEntities = type === MapEntityTypeId.WINDMILL
    ? [{
        type: MapEntityTypeId.WIND_SWITCH,
        x: 0,
        y: 0,
        direction,
        active: true,
      }]
    : [];
  const layer = resolveAt(
    type,
    AMBIENT_STEP_MS,
    direction,
    undefined,
    variant,
    extraEntities,
  );
  assert.equal(layer.kind, "image");
  assert.equal(layer.asset, "original-animated-tiles");
  assert.equal(layer.frameWidth, 48);
  assert.equal(layer.frameHeight, 48);
  assert.equal(layer.frameIndex, frameIndex);
  assert.equal(layer.anchor, "fill");
}

test("original ta.png ambient phase zero keeps the static ts.png atlas frame", () => {
  assert.equal(resolveAt(MapEntityTypeId.WATER, 0, undefined, undefined, "ripple").kind, "atlas");
  assert.equal(
    resolveAt(MapEntityTypeId.WATER, AMBIENT_STEP_MS * 8, undefined, undefined, "ripple").kind,
    "atlas",
  );
});

test("Windmill 只在同方向 Wind Switch 开启时播放叶片动画", () => {
  const inactive = resolveAt(
    MapEntityTypeId.WINDMILL,
    AMBIENT_STEP_MS,
    "right",
    undefined,
    undefined,
    [{
      type: MapEntityTypeId.WIND_SWITCH,
      x: 0,
      y: 0,
      direction: "right",
      active: false,
    }],
  );
  assert.equal(inactive.kind, "atlas");

  const wrongDirection = resolveAt(
    MapEntityTypeId.WINDMILL,
    AMBIENT_STEP_MS,
    "right",
    undefined,
    undefined,
    [{
      type: MapEntityTypeId.WIND_SWITCH,
      x: 0,
      y: 0,
      direction: "left",
      active: true,
    }],
  );
  assert.equal(wrongDirection.kind, "atlas");

  const active = resolveAt(
    MapEntityTypeId.WINDMILL,
    AMBIENT_STEP_MS,
    "right",
    undefined,
    undefined,
    [{
      type: MapEntityTypeId.WIND_SWITCH,
      x: 0,
      y: 0,
      direction: "right",
      active: true,
    }],
  );
  assert.equal(active.kind, "image");
  assert.equal(active.frameIndex, 24);
});

test("original ta.png confirmed fixed Entity mappings use PresentationTime", () => {
  for (const [type, frameIndex, direction, variant] of [
    [MapEntityTypeId.WINDMILL, 18, "up"],
    [MapEntityTypeId.WINDMILL, 20, "down"],
    [MapEntityTypeId.WINDMILL, 22, "left"],
    [MapEntityTypeId.WINDMILL, 24, "right"],
    [MapEntityTypeId.WHIRLWIND, 26],
    [MapEntityTypeId.WATER, 39, undefined, "ripple"],
    [MapEntityTypeId.WATERFALL, 46, undefined, "top"],
    [MapEntityTypeId.WATERFALL, 48, undefined, "middle"],
    [MapEntityTypeId.WATERFALL, 50, undefined, "bottom"],
  ])
    expectAnimated(type, frameIndex, direction, variant);
});

test("Fireball 使用 hud.png 的两张 28px 原版帧", () => {
  const first = resolveAt(RuntimeEntityTypeId.FIREBALL, 0);
  const beforeSecond = resolveAt(
    RuntimeEntityTypeId.FIREBALL,
    FIREBALL_MOVEMENT.frameMs - 0.001,
  );
  const second = resolveAt(
    RuntimeEntityTypeId.FIREBALL,
    FIREBALL_MOVEMENT.frameMs,
  );
  const looped = resolveAt(
    RuntimeEntityTypeId.FIREBALL,
    FIREBALL_MOVEMENT.frameMs * 2,
  );
  assert.deepEqual(first, {
    kind: "image",
    asset: "dragon-fireball",
    sourceX: 282,
    sourceY: 0,
    frameWidth: 28,
    frameHeight: 28,
    anchor: "center",
  });
  assert.deepEqual(beforeSecond, first);
  assert.deepEqual(second, { ...first, sourceX: 310 });
  assert.deepEqual(looped, first);
});

test("original ta.png Speed and Tide mappings preserve DAT direction order", () => {
  for (const [direction, speedFrame, tideFrame] of [
    ["up", 3, 31],
    ["down", 6, 33],
    ["left", 9, 35],
    ["right", 12, 37],
  ]) {
    expectAnimated(MapEntityTypeId.SPEED, speedFrame, direction);
    expectAnimated(MapEntityTypeId.TIDE, tideFrame, direction);
  }
});

test("original ta.png phase advances every 124ms without WorldTick input", () => {
  assert.equal(resolveAt(MapEntityTypeId.WATER, 123, undefined, undefined, "ripple").kind, "atlas");
  const phase1 = resolveAt(MapEntityTypeId.WATER, AMBIENT_STEP_MS, undefined, undefined, "ripple");
  const phase1End = resolveAt(MapEntityTypeId.WATER, 247, undefined, undefined, "ripple");
  const phase2 = resolveAt(MapEntityTypeId.WATER, AMBIENT_STEP_MS * 2, undefined, undefined, "ripple");
  assert.equal(phase1.kind, "image");
  assert.equal(phase1End.frameIndex, 39);
  assert.equal(phase2.kind, "image");
  assert.equal(phase1.frameIndex, 39);
  assert.equal(phase2.frameIndex, 40);
});
