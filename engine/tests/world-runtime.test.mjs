import test from "node:test";
import assert from "node:assert/strict";
import { BehaviorRegistry } from "../dist/world/behavior/BehaviorRegistry.js";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";
import { World } from "../dist/world/World.js";

function registry() {
  const entities = new EntityRegistry();
  entities.registerAll([
    {
      type: "floor",
      traits: ["walkable"],
      stackOrder: 0,
      presentation: { name: "Floor", category: "test" },
      authoring: { palette: true },
    },
    {
      type: "player",
      traits: ["player"],
      stackOrder: 100,
      presentation: { name: "Player", category: "test" },
      authoring: { palette: true },
    },
    {
      type: "wall",
      traits: ["blocking"],
      stackOrder: 100,
      presentation: { name: "Wall", category: "test" },
      authoring: { palette: true },
    },
    {
      type: "box",
      traits: ["blocking", "pushable"],
      stackOrder: 100,
      presentation: { name: "Box", category: "test" },
      authoring: { palette: true },
    },
    {
      type: "goal",
      traits: ["walkable", "goal"],
      stackOrder: 0,
      presentation: { name: "Goal", category: "test" },
      authoring: { palette: true },
    },
    {
      type: "exit-cell",
      traits: ["walkable"],
      stackOrder: 0,
      presentation: { name: "Exit", category: "test" },
      authoring: { palette: true },
    },
    {
      type: "carrot",
      traits: [],
      stackOrder: 100,
      presentation: { name: "Carrot", category: "test" },
      authoring: { palette: true },
    },
    {
      type: "grass",
      traits: ["blocking", "mowable"],
      stackOrder: 200,
      presentation: { name: "Grass", category: "test" },
      authoring: { palette: true },
    },
    {
      type: "item",
      traits: ["item"],
      stackOrder: 100,
      presentation: { name: "Item", category: "test" },
      authoring: { palette: true },
    },
    {
      type: "long",
      traits: [],
      stackOrder: 100,
      footprint: {
        rotateWithDirection: true,
        baseDirection: "right",
        parts: [
          { dx: 0, dy: 0, role: "head" },
          { dx: 1, dy: 0, role: "tail" },
        ],
      },
      presentation: { name: "Long", category: "test" },
      authoring: { palette: true },
    },
  ]);
  return entities;
}

const floor = (x, y, type = "floor") => ({ type, x, y });

test("implicit Void blocks and ordinary floor moves", () => {
  const entities = registry();
  const world = new World(
    {
      schemaVersion: 1,
      width: 3,
      height: 1,
      entities: [floor(0, 0), floor(1, 0), { type: "player", x: 0, y: 0 }],
    },
    { entities, behaviors: new BehaviorRegistry() },
  );
  assert.equal(world.move("right").moved, true);
  assert.equal(world.move("right").moved, false);
  assert.equal(world.player.x, 1);
});

test("pushable movement and fill-all rule use Presence traits", () => {
  const entities = registry();
  const world = new World(
    {
      schemaVersion: 1,
      width: 4,
      height: 1,
      entities: [
        floor(0, 0),
        floor(1, 0),
        floor(2, 0, "goal"),
        floor(3, 0),
        { type: "player", x: 0, y: 0 },
        { type: "box", x: 1, y: 0 },
      ],
      rules: {
        win: {
          type: "fill-all",
          target: "goal",
          filler: "pushable",
        },
      },
    },
    { entities, behaviors: new BehaviorRegistry() },
  );
  assert.deepEqual(world.winState, {
    type: "fill-all",
    target: "goal",
    filler: "pushable",
    completed: false,
    remaining: 1,
  });
  const move = world.move("right");
  assert.equal(move.moved, true);
  assert.deepEqual(world.winState, {
    type: "fill-all",
    target: "goal",
    filler: "pushable",
    completed: true,
    remaining: 0,
  });
  assert.equal(world.completed, true);
  assert.equal(world.query.entitiesWithTrait("pushable")[0].anchor.x, 2);
});

test("win selector can address an Entity type without a matching Trait", () => {
  const entities = registry();
  const world = new World(
    {
      schemaVersion: 1,
      width: 2,
      height: 1,
      entities: [
        floor(0, 0),
        floor(1, 0, "exit-cell"),
        { type: "player", x: 0, y: 0 },
      ],
      rules: { win: { type: "reach", target: "exit-cell" } },
    },
    { entities, behaviors: new BehaviorRegistry() },
  );
  assert.equal(world.completed, false);
  assert.equal(world.move("right").moved, true);
  assert.equal(world.completed, true);
});

test("combined win state keeps objective progress independent", () => {
  const entities = registry();
  const world = new World(
    {
      schemaVersion: 1,
      width: 3,
      height: 1,
      entities: [
        floor(0, 0),
        floor(1, 0),
        floor(2, 0, "exit-cell"),
        { type: "player", x: 0, y: 0 },
        { type: "carrot", x: 1, y: 0 },
      ],
      rules: {
        win: {
          type: "all",
          conditions: [
            { type: "collect-all", target: "carrot" },
            { type: "reach", target: "exit-cell" },
          ],
        },
      },
    },
    { entities, behaviors: new BehaviorRegistry() },
  );
  assert.deepEqual(world.winState, {
    type: "all",
    completed: false,
    conditions: [
      {
        type: "collect-all",
        target: "carrot",
        completed: false,
        remaining: 1,
      },
      {
        type: "reach",
        target: "exit-cell",
        completed: false,
      },
    ],
  });
});

test("blocked touch commits after snapshot without auto-triggering revealed content", () => {
  const entities = registry();
  const behaviors = new BehaviorRegistry();
  behaviors.register({
    id: "clear-cover",
    onTouch({ self, commands }) {
      commands.destroy(self.entity.id);
      commands.emit({ type: "cleared" });
    },
  });
  behaviors.bindTrait("mowable", "clear-cover");
  const world = new World(
    {
      schemaVersion: 1,
      width: 2,
      height: 1,
      entities: [
        floor(0, 0),
        floor(1, 0),
        { type: "player", x: 0, y: 0 },
        { type: "item", x: 1, y: 0 },
        { type: "grass", x: 1, y: 0 },
      ],
    },
    { entities, behaviors },
  );
  const first = world.move("right");
  assert.equal(first.moved, false);
  assert.deepEqual(
    first.events.map((event) => event.type),
    ["cleared"],
  );
  assert.equal(world.player.x, 0);
  assert.equal(world.inspect(1, 0).topPresence.type, "item");
  assert.equal(world.move("right").moved, true);
});

test("directional footprint rotates from its base direction", () => {
  const entities = registry();
  const world = new World(
    {
      schemaVersion: 1,
      width: 4,
      height: 4,
      entities: [
        floor(0, 0),
        { type: "player", x: 0, y: 0 },
        { type: "long", x: 2, y: 1, direction: "down" },
      ],
    },
    { entities, behaviors: new BehaviorRegistry() },
  );
  const entity = world.entities.all().find((item) => item.type === "long");
  assert.deepEqual(
    world.spatial.presencesForEntity(entity.id).map((presence) => presence.cell),
    [
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
  );
});
