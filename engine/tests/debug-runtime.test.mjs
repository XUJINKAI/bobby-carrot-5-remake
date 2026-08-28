import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { buildDebugSnapshot } from "../dist/debug/DebugSnapshot.js";
import { createBuiltinVisualRegistry } from "../dist/entities/registry.js";
import { EngineClock } from "../dist/time/EngineClock.js";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";
import { World } from "../dist/world/World.js";

const ground = (x, y) => ({ type: EntityTypeId.GROUND_C, x, y });

test("Debug snapshot exposes runtime, cell, Entity, Behavior and Visual facts", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      {
        type: EntityTypeId.BOBBY,
        x: 0,
        y: 0,
        direction: "right",
      },
    ],
  });
  const visual = new VisualRuntime(createBuiltinVisualRegistry());
  const clock = new EngineClock();
  clock.pause();
  clock.step(4, (time) => {
    world.update(time);
    visual.update(time, "linear");
  });
  const bobby = world.entities
    .all()
    .find((entity) => entity.type === EntityTypeId.BOBBY);
  assert.ok(bobby);

  const scene = visual.scene(world);
  const snapshot = buildDebugSnapshot({
    world,
    scene,
    visual,
    clock,
    selection: { cell: { x: 0, y: 0 }, entityId: bobby.id },
  });

  assert.equal(snapshot.runtime.tickCount, 4);
  assert.equal(snapshot.runtime.paused, true);
  assert.equal(snapshot.runtime.status, "playing");
  assert.deepEqual(snapshot.runtime.player, { x: 0, y: 0 });
  assert.deepEqual(snapshot.selection?.cell, { x: 0, y: 0 });
  assert.equal(snapshot.selection?.entity?.id, bobby.id);
  assert.equal(snapshot.selection?.entity?.type, EntityTypeId.BOBBY);
  assert.equal(snapshot.selection?.entity?.direction, "right");
  assert.ok(snapshot.selection?.entity?.definition.traits.includes("player"));
  assert.ok(snapshot.selection?.entity?.visual.visualId);
  assert.ok((snapshot.selection?.entity?.visual.renderItems.length ?? 0) > 0);
});

test("Debug snapshot defaults selection to the top Presence", () => {
  const world = new World({
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [
      ground(0, 0),
      {
        type: EntityTypeId.BOBBY,
        x: 0,
        y: 0,
        direction: "down",
      },
    ],
  });
  const visual = new VisualRuntime(createBuiltinVisualRegistry());
  const snapshot = buildDebugSnapshot({
    world,
    scene: visual.scene(world),
    visual,
    clock: new EngineClock(),
    selection: { cell: { x: 0, y: 0 } },
  });
  assert.equal(snapshot.selection?.entity?.type, EntityTypeId.BOBBY);
});
