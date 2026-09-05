import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import {
  createBuiltinEntityRegistry,
  createBuiltinVisualRegistry,
} from "../dist/entities/registry.js";
import { EntityStore } from "../dist/world/entity/EntityStore.js";
import { SpatialIndex } from "../dist/world/spatial/SpatialIndex.js";
import { SpatialVisualQuery } from "../dist/visual/SpatialVisualQuery.js";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";

function motion(id, entityId, cause, durationMs) {
  return {
    id,
    kind: "move",
    entityId,
    from: { x: 0, y: 0 },
    to: { x: 1, y: 0 },
    direction: "right",
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

for (const cadenceMs of [496, 248]) {
  test(`carry presentation group shares ${cadenceMs}ms carrier timeline`, () => {
    const runtime = new VisualRuntime(createBuiltinVisualRegistry(), 48);
    const carrier = motion(1, 7, {
      type: "forced",
      mechanism: "leaf",
      cadenceMs,
    }, cadenceMs);
    const passenger = motion(
      2,
      8,
      { type: "carry", carrierId: 7 },
      cadenceMs,
    );
    const world = {
      definition: () => ({ type: EntityTypeId.BOBBY }),
    };

    runtime.consumeWorldDeltas(
      world,
      [delta(1, carrier), delta(2, passenger)],
      { frame: 0, nowMs: 1000, deltaMs: 0 },
      {
        motionDuration(value) {
          return value.cause.type === "forced" && value.cause.cadenceMs
            ? value.cause.cadenceMs
            : 350;
        },
        stationaryDeathDurationMs: 350,
      },
    );
    runtime.update(
      { frame: 1, nowMs: 1000 + cadenceMs / 2, deltaMs: cadenceMs / 2 },
      "linear",
    );

    const carrierState = runtime.inspectEntity(world, 7).runtime;
    const passengerState = runtime.inspectEntity(world, 8).runtime;
    assert.equal(carrierState.offsetX, -0.5);
    assert.equal(passengerState.offsetX, -0.5);
    assert.equal(carrierState.progress, 0.5);
    assert.equal(passengerState.progress, 0.5);
  });
}

function mountedBobbyVisual(mountType) {
  const entities = createBuiltinEntityRegistry();
  const visuals = createBuiltinVisualRegistry();
  const store = new EntityStore([
    { type: EntityTypeId.GROUND_C, x: 0, y: 0 },
    { type: mountType, x: 0, y: 0 },
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
  const presence = spatial.presencesForEntity(bobby.id)[0];
  assert.ok(presence);
  return visuals.resolve(entities.require(EntityTypeId.BOBBY), {
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
}

test("Leaf mount keeps Bobby on the ordinary standing sprite", () => {
  const visual = mountedBobbyVisual(EntityTypeId.LEAF);
  assert.equal(visual.layers[0].asset, "bobby-right");
  assert.equal(visual.layers[0].frameIndex, 3);
});

test("Mower mount still uses the dedicated Bobby mower sprite", () => {
  const visual = mountedBobbyVisual(EntityTypeId.MOWER);
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
