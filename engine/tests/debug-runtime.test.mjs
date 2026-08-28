import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { buildDebugSnapshot } from "../dist/debug/DebugSnapshot.js";
import { createBuiltinVisualRegistry } from "../dist/entities/registry.js";
import { resolveEngineTiming } from "../dist/time/EngineTiming.js";
import { PresentationClock } from "../dist/time/PresentationClock.js";
import { WorldClock } from "../dist/time/WorldClock.js";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";
import { World } from "../dist/world/World.js";

const ground = (x, y) => ({ type: EntityTypeId.GROUND_C, x, y });

function debugTime() {
  const timing = resolveEngineTiming();
  const worldClock = new WorldClock(timing.worldHz);
  const presentationClock = new PresentationClock(timing.presentationHz);
  presentationClock.advance(1000);
  return { timing, worldClock, presentationClock };
}

test("Debug snapshot exposes both clocks, actions, Entity, Behavior and Visual facts", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const visual = new VisualRuntime(createBuiltinVisualRegistry());
  const { timing, worldClock, presentationClock } = debugTime();
  worldClock.pause();
  worldClock.step(4, (time) => world.update(time));
  const frame = presentationClock.advance(1017);
  assert.ok(frame);
  visual.update(frame, "linear");
  const bobby = world.entities
    .all()
    .find((entity) => entity.type === EntityTypeId.BOBBY);
  assert.ok(bobby);

  const scene = visual.scene(world);
  const snapshot = buildDebugSnapshot({
    world,
    scene,
    visual,
    worldClock,
    presentationClock,
    timing,
    selection: { cell: { x: 0, y: 0 }, entityId: bobby.id },
  });

  assert.equal(snapshot.runtime.worldTickCount, 4);
  assert.equal(snapshot.runtime.worldPaused, true);
  assert.equal(snapshot.runtime.worldHz, 16);
  assert.equal(snapshot.runtime.presentationHz, 60);
  assert.equal(snapshot.runtime.status, "playing");
  assert.equal(snapshot.runtime.actionCount, 0);
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
      { type: EntityTypeId.BOBBY, x: 0, y: 0, direction: "down" },
    ],
  });
  const visual = new VisualRuntime(createBuiltinVisualRegistry());
  const { timing, worldClock, presentationClock } = debugTime();
  const snapshot = buildDebugSnapshot({
    world,
    scene: visual.scene(world),
    visual,
    worldClock,
    presentationClock,
    timing,
    selection: { cell: { x: 0, y: 0 } },
  });
  assert.equal(snapshot.selection?.entity?.type, EntityTypeId.BOBBY);
});

test("Debug Sidebar keeps interactive controls mounted across presentation renders", () => {
  const source = fs.readFileSync(
    new URL("../src/debug/DebugSidebar.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /content\.replaceChildren\(/);
  assert.match(source, /private readonly pauseButton/);
  assert.match(source, /private readonly selectionStack/);
});
