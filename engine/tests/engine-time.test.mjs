import test from "node:test";
import assert from "node:assert/strict";
import { BehaviorRegistry } from "../dist/world/behavior/BehaviorRegistry.js";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";
import { World } from "./support/World.mjs";

test("World onTick receives the shared WorldTick", () => {
  const entities = new EntityRegistry();
  entities.registerAll([
    {
      type: "floor",
      facts: ["walkable"],
      stackBand: "surface",
      presentation: { name: "Floor", category: "test" },
    },
    {
      type: "player",
      facts: ["player"],
      stackBand: "content",
      presentation: { name: "Player", category: "test" },
    },
    {
      type: "ticker",
      facts: ["ticker"],
      behaviors: ["capture-time"],
      stackBand: "content",
      presentation: { name: "Ticker", category: "test" },
    },
  ]);
  const behaviors = new BehaviorRegistry();
  const seen = [];
  behaviors.register({
    id: "capture-time",
    onTick({ time }) {
      seen.push(time);
    },
  });
  const world = new World(
    {
      schemaVersion: 1,
      width: 2,
      height: 1,
      entities: [
        { type: "floor", x: 0, y: 0 },
        { type: "floor", x: 1, y: 0 },
        { type: "player", x: 0, y: 0 },
        { type: "ticker", x: 1, y: 0 },
      ],
    },
    { entities, behaviors },
  );
  const time = { tick: 7, stepMs: 50 };
  world.update(time);
  assert.deepEqual(seen, [time]);
});
