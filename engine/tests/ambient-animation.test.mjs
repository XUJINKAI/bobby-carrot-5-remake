import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../dist/entities/registry.js";
import { SpatialVisualQuery } from "../dist/visual/SpatialVisualQuery.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";

const AMBIENT_STEP_MS = 248;

function resolveAt(type, nowMs, direction) {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    {
      type,
      x: 0,
      y: 0,
      ...(direction ? { direction } : {}),
    },
  ]);
  const spatial = new SpatialIndex(store, entities, 1, 1);
  const entity = store.all()[0];
  assert.ok(entity);
  const presence = spatial.presencesForEntity(entity.id)[0];
  assert.ok(presence);
  const composition = visuals.resolve(entities.require(type), {
    entity,
    presence,
    query: new SpatialVisualQuery(store, spatial),
    time: { frame: 1, nowMs, deltaMs: 16 },
  });
  assert.ok(composition);
  const layer = composition.layers[0];
  assert.ok(layer);
  return layer;
}

function expectAnimated(type, frameIndex, direction) {
  const layer = resolveAt(type, AMBIENT_STEP_MS, direction);
  assert.equal(layer.kind, "image");
  assert.equal(layer.asset, "original-animated-tiles");
  assert.equal(layer.frameWidth, 48);
  assert.equal(layer.frameHeight, 48);
  assert.equal(layer.frameIndex, frameIndex);
  assert.equal(layer.anchor, "fill");
}

test("original ta.png ambient phase zero keeps the static ts.png atlas frame", () => {
  assert.equal(resolveAt(EntityTypeId.WATER_ANIMATED, 0).kind, "atlas");
  assert.equal(
    resolveAt(EntityTypeId.WATER_ANIMATED, AMBIENT_STEP_MS * 8).kind,
    "atlas",
  );
});

test("original ta.png confirmed fixed Entity mappings use PresentationTime", () => {
  for (const [type, frameIndex] of [
    [EntityTypeId.EXIT, 0],
    [EntityTypeId.BONUS_COIN, 15],
    [EntityTypeId.WINDMILL_UP, 18],
    [EntityTypeId.WINDMILL_DOWN, 20],
    [EntityTypeId.WINDMILL_LEFT, 22],
    [EntityTypeId.WINDMILL_RIGHT, 24],
    [EntityTypeId.WHIRLWIND, 26],
    [EntityTypeId.WATER_ANIMATED, 39],
    [EntityTypeId.WATER_VARIANT_1, 46],
    [EntityTypeId.WATER_VARIANT_2, 48],
    [EntityTypeId.WATER_VARIANT_3, 50],
  ])
    expectAnimated(type, frameIndex);
});

test("original ta.png Speed and Tide mappings preserve DAT direction order", () => {
  for (const [direction, speedFrame, tideFrame] of [
    ["up", 3, 33],
    ["down", 6, 31],
    ["left", 9, 37],
    ["right", 12, 35],
  ]) {
    expectAnimated(EntityTypeId.SPEED, speedFrame, direction);
    expectAnimated(EntityTypeId.TIDE, tideFrame, direction);
  }
});

test("original ta.png phase advances every 248ms without WorldTick input", () => {
  const phase1 = resolveAt(EntityTypeId.WATER_ANIMATED, AMBIENT_STEP_MS);
  const phase2 = resolveAt(EntityTypeId.WATER_ANIMATED, AMBIENT_STEP_MS * 2);
  assert.equal(phase1.kind, "image");
  assert.equal(phase2.kind, "image");
  assert.equal(phase1.frameIndex, 39);
  assert.equal(phase2.frameIndex, 40);
});
