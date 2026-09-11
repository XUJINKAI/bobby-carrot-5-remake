import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { World } from "../dist/world/World.js";

function dialogLevel(dialogue, type = MapEntityTypeId.SANDMAN) {
  return {
    schemaVersion: 1,
    width: 2,
    height: 2,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 0, y: 1 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 1 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 1, direction: "right" },
      {
        type,
        x: 1,
        y: 1,
        ...(dialogue === undefined ? {} : { dialogue }),
      },
    ],
  };
}

function move(world, direction) {
  const player = actor(world);
  return world.step({
    intents: [
      {
        type: "move",
        actorId: player.id,
        direction,
        cause: { type: "player-input", source: "test" },
      },
    ],
  });
}

function actor(world) {
  const player = world.query.entitiesWithTrait("player")[0];
  assert.ok(player, "test map must contain a player actor");
  return player;
}

test("地图 dialogue 在角色身体被碰触时产生可传播的对白", () => {
  const world = new World(dialogLevel("hello world!"));
  const result = move(world, "right");
  assert.equal(result.moves[0].moved, false);
  assert.deepEqual(
    result.events.map((event) => event.type),
    ["object-interaction", "dialog"],
  );
  const interaction = result.events[0];
  assert.equal(interaction.actorId, actor(world).id);
  assert.equal(interaction.objectType, MapEntityTypeId.SANDMAN);
  assert.equal(interaction.role, "body");
  assert.equal(interaction.requestId, 1);
  assert.equal(
    result.events.find((event) => event.type === "dialog")?.text,
    "hello world!",
  );
});

test("没有地图对白时仍产生通用交互请求", () => {
  const world = new World(dialogLevel());
  const first = move(world, "right");
  const second = move(world, "right");

  assert.deepEqual(
    first.events.map((event) => event.type),
    ["object-interaction"],
  );
  assert.equal(first.events[0].requestId, 1);
  assert.equal(second.events[0].requestId, 2);
});

test("Sandman、Beaver 与 Dream Machine 共用地图对白合同", () => {
  for (const type of [
    MapEntityTypeId.SANDMAN,
    MapEntityTypeId.BEAVER,
    MapEntityTypeId.DREAM_MACHINE,
  ]) {
    const result = move(new World(dialogLevel(type, type)), "right");
    assert.equal(
      result.events.find((event) => event.type === "dialog")?.text,
      type,
    );
  }
});

test("商品地块阻挡移动并在触碰时产生通用交互请求", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: MapEntityTypeId.SHOP_SPEED_SHOES, x: 1, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });

  const result = move(world, "right");
  assert.equal(result.moves[0].moved, false);
  assert.deepEqual(result.events.map((event) => event.type), [
    "object-interaction",
  ]);
  assert.equal(result.events[0].action, "touch");
  assert.equal(result.events[0].objectType, MapEntityTypeId.SHOP_SPEED_SHOES);
  assert.equal(result.events[0].requestId, 1);
});
