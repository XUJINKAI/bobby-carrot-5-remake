import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { World } from "./support/World.mjs";

function dialogLevel(
  dialogue,
  type = MapEntityTypeId.SANDMAN,
  bobbyY = 1,
) {
  return {
    schemaVersion: 1,
    width: 2,
    height: 2,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 0, y: 1 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 1 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: bobbyY, direction: "right" },
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
  const player = world.query.entitiesWithFact("player")[0];
  assert.ok(player, "test map must contain a player actor");
  return player;
}

test("地图 dialogue 在角色身体被碰触时产生 Engine 私有对白请求", () => {
  const world = new World(dialogLevel("hello world!"));
  const result = move(world, "right");
  assert.equal(result.moves[0].moved, false);
  assert.deepEqual(result.events.map((event) => event.type), ["dialogue-request"]);
  const interaction = result.events[0];
  assert.equal(interaction.actorId, actor(world).id);
  assert.equal(interaction.objectType, MapEntityTypeId.SANDMAN);
  assert.equal(interaction.role, "body");
  assert.equal(interaction.requestId, undefined);
  assert.deepEqual(interaction.lines, ["hello world!"]);
});

test("地图 dialogue 数组每次触碰都提交完整会话且不写 Runtime 游标", () => {
  const world = new World(dialogLevel(["第一段\n允许换行", "第二段"]));
  const sessions = [0, 1, 2].map(
    () => move(world, "right").events[0]?.lines,
  );

  assert.deepEqual(sessions, [
    ["第一段\n允许换行", "第二段"],
    ["第一段\n允许换行", "第二段"],
    ["第一段\n允许换行", "第二段"],
  ]);
  assert.equal(actor(world).state?.dialogueIndex, undefined);
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
    assert.deepEqual(result.events[0]?.lines, [type]);
  }
});

test("直立双格对象的 passable head 按进入的 Presence 触发对白", () => {
  for (const type of [
    MapEntityTypeId.SANDMAN,
    MapEntityTypeId.BEAVER,
    MapEntityTypeId.DREAM_MACHINE,
  ]) {
    const world = new World(dialogLevel(type, type, 0));
    const started = move(world, "right");
    assert.equal(started.moves[0].moved, true, type);
    const interaction = started.events.find((event) =>
      event.type === "dialogue-request"
    );
    assert.ok(interaction, type);
    assert.equal(interaction.role, "head", type);
    assert.equal(interaction.action, "enter", type);
    assert.deepEqual(interaction.lines, [type], type);
  }
});

test("passable head 没有字面对白时产生通用交互请求", () => {
  const world = new World(dialogLevel(
    undefined,
    MapEntityTypeId.DREAM_MACHINE,
    0,
  ));
  const result = move(world, "right");

  assert.equal(result.moves[0].moved, true);
  assert.equal(result.events[0]?.type, "object-interaction");
  assert.equal(result.events[0]?.role, "head");
  assert.equal(result.events[0]?.action, "enter");
  assert.equal(result.events[0]?.requestId, 1);
});

test("Snowman 图块在触碰时发出地图对白", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      {
        type: MapEntityTypeId.SNOWMAN,
        variant: "ts-4-3",
        x: 1,
        y: 0,
        dialogue: "雪人对白",
      },
    ],
  });

  const result = move(world, "right");
  assert.equal(result.moves[0].moved, false);
  assert.deepEqual(result.events[0]?.lines, ["雪人对白"]);
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
