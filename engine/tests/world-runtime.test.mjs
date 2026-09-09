import test from "node:test";
import assert from "node:assert/strict";
import { BehaviorRegistry } from "../dist/world/behavior/BehaviorRegistry.js";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";
import { World } from "../dist/world/World.js";

function registry() {
  const entities = new EntityRegistry();
  entities.registerAll([
    { type: "floor", traits: ["walkable"], layer: "surface", stackOrder: 0 },
    { type: "player", traits: ["player"], layer: "object", stackOrder: 100 },
    { type: "wall", traits: ["blocking"], layer: "object", stackOrder: 100 },
    { type: "box", traits: ["blocking", "pushable"], layer: "object", stackOrder: 100 },
    { type: "goal", traits: ["walkable", "goal"], layer: "surface", stackOrder: 0 },
    { type: "exit-cell", traits: ["walkable"], layer: "surface", stackOrder: 0 },
    { type: "carrot", traits: [], layer: "object", stackOrder: 100 },
    { type: "grass", traits: ["blocking", "mowable"], layer: "cover", stackOrder: 200 },
    { type: "item", traits: ["item"], layer: "object", stackOrder: 100 },
    {
      type: "long",
      traits: [],
      layer: "object",
      stackOrder: 100,
      footprint: {
        byDirection: {
          right: [
            { dx: 0, dy: 0, role: "head" },
            { dx: 1, dy: 0, role: "tail" },
          ],
          down: [
            { dx: 0, dy: 0, role: "head" },
            { dx: 0, dy: 1, role: "tail" },
          ],
        },
      },
    },
  ]);
  return entities;
}

const floor = (x, y, type = "floor") => ({ type, x, y });

function actorIds(world) {
  return world.query.entitiesWithTrait("player").map((entity) => entity.id);
}

function move(world, actorId, direction, source = "test") {
  return world.step({
    historyBoundary: true,
    intents: [
      {
        type: "move",
        actorId,
        direction,
        cause: { type: "player-input", source },
      },
    ],
  });
}

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
  const actor = actorIds(world)[0];
  assert.equal(move(world, actor, "right").moves[0].moved, true);
  assert.equal(move(world, actor, "right").moves[0].moved, false);
  assert.equal(world.entity(actor).anchor.x, 1);
});

test("pushable movement is one transaction and fill-all uses Presence traits", () => {
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
      rules: { win: { type: "fill-all", target: "goal", filler: "pushable" } },
    },
    { entities, behaviors: new BehaviorRegistry() },
  );
  const actor = actorIds(world)[0];
  const box = world.query.entitiesWithTrait("pushable")[0];
  const step = move(world, actor, "right");
  assert.equal(step.moves[0].moved, true);
  assert.deepEqual(new Set(step.mutations.moved), new Set([actor, box.id]));
  assert.equal(world.completed, true);
  assert.equal(world.entity(box.id).anchor.x, 2);
});

test("reach selector can address an Entity type without a matching Trait", () => {
  const entities = registry();
  const world = new World(
    {
      schemaVersion: 1,
      width: 2,
      height: 1,
      entities: [floor(0, 0), floor(1, 0, "exit-cell"), { type: "player", x: 0, y: 0 }],
      rules: { win: { type: "reach", target: "exit-cell" } },
    },
    { entities, behaviors: new BehaviorRegistry() },
  );
  const actor = actorIds(world)[0];
  assert.equal(world.completed, false);
  assert.equal(move(world, actor, "right").moves[0].moved, true);
  assert.equal(world.completed, true);
});

test("World accepts multiple player actors and one intent group counts as one move", () => {
  const entities = registry();
  const world = new World(
    {
      schemaVersion: 1,
      width: 4,
      height: 1,
      entities: [
        floor(0, 0), floor(1, 0), floor(2, 0), floor(3, 0),
        { type: "player", x: 0, y: 0, direction: "right" },
        { type: "player", x: 3, y: 0, direction: "left" },
      ],
    },
    { entities, behaviors: new BehaviorRegistry() },
  );
  const [left, right] = actorIds(world);
  const step = world.step({
    historyBoundary: true,
    intents: [
      { type: "move", actorId: left, direction: "right", cause: { type: "player-input", source: "arrows" } },
      { type: "move", actorId: right, direction: "left", cause: { type: "player-input", source: "arrows" } },
    ],
  });
  assert.equal(step.moves.filter((item) => item.moved).length, 2);
  assert.equal(step.motions.length, 2);
  assert.equal(world.entity(left).anchor.x, 1);
  assert.equal(world.entity(right).anchor.x, 2);
  assert.equal(world.state.moves, 1);
});

test("同一 intent group 的两个 actor 争用同一目标格时全部拒绝", () => {
  const entities = registry();
  const world = new World(
    {
      schemaVersion: 1,
      width: 3,
      height: 1,
      entities: [
        floor(0, 0), floor(1, 0), floor(2, 0),
        { type: "player", x: 0, y: 0 },
        { type: "player", x: 2, y: 0 },
      ],
    },
    { entities, behaviors: new BehaviorRegistry() },
  );
  const [left, right] = actorIds(world);
  const step = world.step({
    intents: [
      { type: "move", actorId: left, direction: "right", cause: { type: "player-input" } },
      { type: "move", actorId: right, direction: "left", cause: { type: "player-input" } },
    ],
  });

  assert.deepEqual(step.moves.map((move) => move.passage.reason), [
    "destination-conflict",
    "destination-conflict",
  ]);
  assert.deepEqual(world.entity(left).anchor, { x: 0, y: 0 });
  assert.deepEqual(world.entity(right).anchor, { x: 2, y: 0 });
  assert.equal(world.state.moves, 0);
});

test("clear-and-pass removes blocking cover and completes the same movement", () => {
  const entities = registry();
  const behaviors = new BehaviorRegistry();
  behaviors.register({
    id: "clear-cover",
    resolveEntry({ self, commands }) {
      commands.destroy(self.entity.id);
      commands.emit({ type: "cleared" });
      return { result: "clear-and-pass", reason: "test-clear" };
    },
  });
  behaviors.bindTrait("mowable", "clear-cover");
  const world = new World(
    {
      schemaVersion: 1,
      width: 2,
      height: 1,
      entities: [
        floor(0, 0), floor(1, 0),
        { type: "player", x: 0, y: 0 },
        { type: "item", x: 1, y: 0 },
        { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      ],
    },
    { entities, behaviors },
  );
  const actor = actorIds(world)[0];
  const step = move(world, actor, "right");
  assert.equal(step.moves[0].moved, true);
  assert.deepEqual(step.events.map((event) => event.type), ["cleared"]);
  assert.equal(world.entity(actor).anchor.x, 1);
  assert.equal(world.inspect(1, 0).topPresence.type, "item");
});

test("layer is semantic and independent from stackOrder", () => {
  const entities = registry();
  const world = new World(
    {
      schemaVersion: 1,
      width: 1,
      height: 1,
      entities: [floor(0, 0), { type: "item", x: 0, y: 0 }],
    },
    { entities, behaviors: new BehaviorRegistry() },
  );
  const inspection = world.inspect(0, 0);
  assert.equal(inspection.presences.find((item) => item.type === "floor").layer, "surface");
  assert.equal(inspection.presences.find((item) => item.type === "item").layer, "object");
});

test("directional footprint uses the explicitly declared direction layout", () => {
  const entities = registry();
  const world = new World(
    {
      schemaVersion: 1,
      width: 4,
      height: 4,
      entities: [floor(0, 0), { type: "player", x: 0, y: 0 }, { type: "long", x: 2, y: 1, direction: "down" }],
    },
    { entities, behaviors: new BehaviorRegistry() },
  );
  const entity = world.entities.all().find((item) => item.type === "long");
  assert.deepEqual(
    world.spatial.presencesForEntity(entity.id).map((presence) => presence.cell),
    [{ x: 2, y: 1 }, { x: 2, y: 2 }],
  );
});
