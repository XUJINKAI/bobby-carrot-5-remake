import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../dist/entities/registry.js";
import {
  LEAF_SUPPORT_HEIGHT_PX,
} from "../dist/entities/original/moving-entities.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";
import { SpatialVisualQuery } from "../dist/visual/SpatialVisualQuery.js";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";
import { World } from "../dist/world/World.js";

function motion(id, entityId, cause, durationMs, options = {}) {
  const from = options.from ?? { x: 0, y: 0 };
  const to = options.to ?? { x: 1, y: 0 };
  const direction = options.direction ?? "right";
  return {
    id,
    kind: "move",
    entityId,
    from,
    to,
    direction,
    cause,
    durationMs,
    elapsedMs: 0,
    progress: 0,
    status: "running",
  };
}

function delta(sequence, motionValue) {
  return {
    sequence,
    worldTick: 1,
    worldTimeMs: 0,
    type: "motion-started",
    motion: motionValue,
  };
}

function presentationOptions() {
  return {
    motionDuration(value) {
      return value.durationMs;
    },
    stationaryDeathDurationMs: 350,
  };
}

function carryWorld() {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: EntityTypeId.WATER, x: 0, y: 0 },
      { type: EntityTypeId.WATER, x: 1, y: 0 },
      { type: EntityTypeId.LEAF, x: 1, y: 0, direction: "down" },
      { type: EntityTypeId.BOBBY, x: 1, y: 0, direction: "right" },
    ],
  });
  const bobby = world.query.entitiesWithTrait("player")[0];
  bobby.direction = "right";
  return world;
}

for (const cadenceMs of [496, 248]) {
  test(`carry presentation group shares ${cadenceMs}ms carrier timeline`, () => {
    const runtime = new VisualRuntime(createBuiltinVisualRegistry(), 48);
    const world = carryWorld();
    const leaf = world.query.entitiesWithTrait("leaf")[0];
    const bobby = world.query.entitiesWithTrait("player")[0];
    const carrier = motion(
      1,
      leaf.id,
      { type: "forced", mechanism: "leaf", cadenceMs },
      cadenceMs,
    );
    const passenger = motion(
      2,
      bobby.id,
      { type: "carry", carrierId: leaf.id },
      cadenceMs,
    );

    runtime.consumeWorldDeltas(
      world,
      [delta(1, carrier), delta(2, passenger)],
      { frame: 0, nowMs: 1000, deltaMs: 0 },
      presentationOptions(),
    );
    runtime.update(
      { frame: 1, nowMs: 1000 + cadenceMs / 2, deltaMs: cadenceMs / 2 },
      "linear",
    );

    const carrierState = runtime.inspectEntity(world, leaf.id).runtime;
    const passengerState = runtime.inspectEntity(world, bobby.id).runtime;
    assert.equal(carrierState.offsetX, -0.5);
    assert.equal(passengerState.offsetX, -0.5);
    assert.equal(carrierState.progress, 0.5);
    assert.equal(passengerState.progress, 0.5);
    assert.equal(passengerState.animation, "carry");
    assert.equal(passengerState.elevationPx, LEAF_SUPPORT_HEIGHT_PX);
    assert.equal(passengerState.direction, undefined);
  });
}

function bobbyVisualOnSurface(surfaceType, runtime, state = {}) {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    { type: surfaceType, x: 0, y: 0 },
    {
      type: EntityTypeId.BOBBY,
      x: 0,
      y: 0,
      direction: "right",
      state,
    },
  ]);
  const spatial = new SpatialIndex(store, entities, 1, 1);
  const bobby = store.require(2);
  bobby.direction = "right";
  if (Object.keys(state).length > 0) bobby.state = structuredClone(state);
  const presence = spatial.presencesForEntity(bobby.id)[0];
  assert.ok(presence);
  return visuals.resolve(entities.require(EntityTypeId.BOBBY), {
    entity: bobby,
    presence,
    query: new SpatialVisualQuery(store, spatial),
    runtime,
    time: { frame: 1, nowMs: 1000, deltaMs: 16 },
  });
}

test("Bobby self movement on a Leaf uses the ordinary walking strip", () => {
  const visual = bobbyVisualOnSurface(EntityTypeId.LEAF, {
    offsetX: -0.5,
    elevationPx: LEAF_SUPPORT_HEIGHT_PX,
    moving: true,
    progress: 0.5,
    direction: "right",
  });
  assert.equal(visual.layers[0].asset, "bobby-right");
  assert.equal(visual.layers[0].frameIndex, 7);
  assert.equal(visual.layers[0].offsetY, -12 - LEAF_SUPPORT_HEIGHT_PX);
});

test("Bobby carried by a Leaf keeps its own facing and standing frame", () => {
  const visual = bobbyVisualOnSurface(EntityTypeId.LEAF, {
    offsetX: -0.5,
    elevationPx: LEAF_SUPPORT_HEIGHT_PX,
    moving: true,
    progress: 0.5,
    animation: "carry",
  });
  assert.equal(visual.layers[0].asset, "bobby-right");
  assert.equal(visual.layers[0].frameIndex, 3);
  assert.equal(visual.layers[0].offsetY, -12 - LEAF_SUPPORT_HEIGHT_PX);
});

test("Bobby steps up onto Leaf exactly at movement midpoint", () => {
  const world = carryWorld();
  const bobby = world.query.entitiesWithTrait("player")[0];
  const runtime = new VisualRuntime(createBuiltinVisualRegistry(), 48);
  const entering = motion(
    1,
    bobby.id,
    { type: "player-input" },
    100,
  );
  runtime.consumeWorldDeltas(
    world,
    [delta(1, entering)],
    { frame: 0, nowMs: 1000, deltaMs: 0 },
    presentationOptions(),
  );

  runtime.update({ frame: 1, nowMs: 1049, deltaMs: 49 }, "linear");
  assert.equal(runtime.inspectEntity(world, bobby.id).runtime.elevationPx, 0);
  runtime.update({ frame: 2, nowMs: 1050, deltaMs: 1 }, "linear");
  assert.equal(
    runtime.inspectEntity(world, bobby.id).runtime.elevationPx,
    LEAF_SUPPORT_HEIGHT_PX,
  );
});

test("Bobby steps down from Leaf exactly at movement midpoint", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
      { type: EntityTypeId.WATER, x: 1, y: 0 },
      { type: EntityTypeId.LEAF, x: 1, y: 0 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "left" },
    ],
  });
  const bobby = world.query.entitiesWithTrait("player")[0];
  const runtime = new VisualRuntime(createBuiltinVisualRegistry(), 48);
  const leaving = motion(
    1,
    bobby.id,
    { type: "player-input" },
    100,
    { from: { x: 1, y: 0 }, to: { x: 0, y: 0 }, direction: "left" },
  );
  runtime.consumeWorldDeltas(
    world,
    [delta(1, leaving)],
    { frame: 0, nowMs: 1000, deltaMs: 0 },
    presentationOptions(),
  );

  runtime.update({ frame: 1, nowMs: 1049, deltaMs: 49 }, "linear");
  assert.equal(
    runtime.inspectEntity(world, bobby.id).runtime.elevationPx,
    LEAF_SUPPORT_HEIGHT_PX,
  );
  runtime.update({ frame: 2, nowMs: 1050, deltaMs: 1 }, "linear");
  assert.equal(runtime.inspectEntity(world, bobby.id).runtime.elevationPx, 0);
});

test("Mower mount still uses the dedicated Bobby mower sprite", () => {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
    { type: EntityTypeId.MOWER, x: 0, y: 0 },
    {
      type: EntityTypeId.BOBBY,
      x: 0,
      y: 0,
      direction: "right",
      state: { mountId: 2 },
    },
  ]);
  const spatial = new SpatialIndex(store, entities, 1, 1);
  const bobby = store.require(3);
  bobby.direction = "right";
  bobby.state = { mountId: 2 };
  const presence = spatial.presencesForEntity(bobby.id)[0];
  assert.ok(presence);
  const visual = visuals.resolve(entities.require(EntityTypeId.BOBBY), {
    entity: bobby,
    presence,
    query: new SpatialVisualQuery(store, spatial),
    runtime: {
      offsetX: -0.5,
      moving: true,
      progress: 0.5,
      direction: "right",
    },
    time: { frame: 1, nowMs: 1000, deltaMs: 16 },
  });
  assert.equal(visual.layers[0].asset, "bobby-mower");
});

for (const [direction, frameIndex] of [
  ["up", 31],
  ["down", 33],
  ["left", 35],
  ["right", 37],
]) {
  test(`Tide ${direction} animated frame follows its logical direction`, () => {
    const entities = createBuiltinEntityRegistry();
    const visuals = createBuiltinVisualRegistry();
    const store = new EntityStore([
      { type: EntityTypeId.TIDE, x: 0, y: 0, direction },
    ]);
    const spatial = new SpatialIndex(store, entities, 1, 1);
    const tide = store.require(1);
    const presence = spatial.presencesForEntity(tide.id)[0];
    assert.ok(presence);
    const visual = visuals.resolve(entities.require(EntityTypeId.TIDE), {
      entity: tide,
      presence,
      query: new SpatialVisualQuery(store, spatial),
      time: { frame: 1, nowMs: 248, deltaMs: 16 },
    });
    assert.deepEqual(visual.layers[0], {
      kind: "image",
      asset: "original-animated-tiles",
      frameWidth: 48,
      frameHeight: 48,
      frameIndex,
      anchor: "fill",
    });
  });
}
