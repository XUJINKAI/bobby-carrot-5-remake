import test from "node:test";
import assert from "node:assert/strict";
import { BehaviorRegistry } from "../dist/world/behavior/BehaviorRegistry.js";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";
import { World } from "../dist/world/World.js";

test("World onTick receives the shared WorldTick", () => {
  const entities = new EntityRegistry();
  entities.registerAll([
    {
      type: "floor",
      traits: ["walkable"],
      stackBand: "surface",
      presentation: { name: "Floor", category: "test" },
      authoring: { palette: true },
    },
    {
      type: "player",
      traits: ["player"],
      stackBand: "content",
      presentation: { name: "Player", category: "test" },
      authoring: { palette: true },
    },
    {
      type: "ticker",
      traits: ["ticker"],
      stackBand: "content",
      presentation: { name: "Ticker", category: "test" },
      authoring: { palette: true },
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
  behaviors.bindTrait("ticker", "capture-time");
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
