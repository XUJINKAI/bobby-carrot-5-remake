import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { RuntimeEntityTypeId } from "../dist/entities/runtime-types.js";
import { readBobbyInventory } from "../dist/entities/player/BobbyState.js";
import { World } from "../dist/world/World.js";

const ground = (x, y) => ({ type: "grass", variant: "ts-10-1", x, y });

function actors(world) {
  return world.query.entitiesWithTrait("player");
}

function move(world, actorId, direction) {
  return world.step({
    intents: [
      {
        type: "move",
        actorId,
        direction,
        cause: { type: "player-input", source: "test" },
      },
    ],
  });
}

test("World 拒绝初始位置重叠的 Bobby", () => {
  assert.throws(
    () => new World({
      schemaVersion: 1,
      width: 1,
      height: 1,
      entities: [
        ground(0, 0),
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      ],
    }),
    /不能占据同一格/,
  );
});

test("pickup inventory belongs only to the Bobby that enters the cell", () => {
  const world = new World({
    schemaVersion: 1,
    width: 3,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      ground(2, 0),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      { type: MapEntityTypeId.BOBBY, x: 2, y: 0, direction: "left" },
      { type: MapEntityTypeId.GAS, x: 1, y: 0 },
    ],
  });
  const [left, right] = actors(world);
  assert.ok(left && right);

  assert.equal(move(world, left.id, "right").moves[0].moved, true);
  assert.equal(readBobbyInventory(world.entity(left.id)?.state).gas, true);
  assert.equal(readBobbyInventory(world.entity(right.id)?.state).gas, false);
});

test("Bobby 不能进入另一个 Bobby 占据的格子", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 1, y: 0 },
    ],
  });
  const [left] = actors(world);

  const result = move(world, left.id, "right");

  assert.equal(result.moves[0].moved, false);
  assert.equal(result.moves[0].passage.reason, "player-occupied");
  assert.deepEqual(world.entity(left.id).anchor, { x: 0, y: 0 });
});

test("飞行中的 Bobby 也不能穿入另一个 Bobby 所在格", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 1, y: 0 },
    ],
  });
  const [left] = actors(world);
  left.state = { ...(left.state ?? {}), flying: true };

  const result = move(world, left.id, "right");

  assert.equal(result.moves[0].moved, false);
  assert.equal(result.moves[0].passage.reason, "player-occupied");
});

test("bean pickup increments only the acting Bobby inventory", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      {
        type: MapEntityTypeId.BOBBY,
        x: 0,
        y: 0,

      },
      { type: MapEntityTypeId.BEAN, x: 1, y: 0 },
    ],
  });
  const [bobby] = actors(world);
  assert.ok(bobby);
  bobby.state = { beans: 2 };

  move(world, bobby.id, "right");
  assert.equal(readBobbyInventory(world.entity(bobby.id)?.state).beans, 3);
});

test("lock-key pickup increments inventory and leaves walkable ground", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      { type: MapEntityTypeId.LOCK_KEY, x: 1, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
    ],
  });
  const [bobby] = actors(world);
  assert.ok(bobby);

  const result = move(world, bobby.id, "right");
  assert.equal(result.moves[0].moved, true);
  assert.equal(readBobbyInventory(world.entity(bobby.id)?.state).lockKeys, 1);
  assert.equal(
    world.entities.all().some((entity) =>
      entity.type === MapEntityTypeId.SHOP_EMPTY &&
      entity.anchor.x === 1 &&
      entity.anchor.y === 0
    ),
    true,
  );
});

test("不可拾取的 lock-key 阻挡 Bobby 并发出交互", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      { type: MapEntityTypeId.LOCK_KEY, x: 1, y: 0, collectible: false },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
    ],
  });
  const [bobby] = actors(world);
  assert.ok(bobby);

  const result = move(world, bobby.id, "right");
  assert.equal(result.moves[0].blocked, true);
  assert.equal(readBobbyInventory(world.entity(bobby.id)?.state).lockKeys, 0);
  assert.equal(
    result.events.some((event) =>
      event.type === "object-interaction" &&
      event.objectType === MapEntityTypeId.LOCK_KEY
    ),
    true,
  );
});

test("shovel pickup leaves a canonical walkable surface behind", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      { type: MapEntityTypeId.SHOVEL_PICKUP, x: 1, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const [bobby] = actors(world);
  assert.ok(bobby);

  const result = move(world, bobby.id, "right");
  assert.equal(result.moves[0].moved, true);
  assert.equal(readBobbyInventory(world.entity(bobby.id)?.state).shovel, true);
  assert.equal(
    world.entities
      .all()
      .some((entity) => entity.type === RuntimeEntityTypeId.SHOVEL_CLEARED_GROUND),
    true,
  );
  assert.equal(world.presencesAt({ x: 1, y: 0 }).some((p) => p.traits.includes("walkable")), true);
});
