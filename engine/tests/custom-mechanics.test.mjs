import test from "node:test";
import assert from "node:assert/strict";
import {
  CustomObjectId,
  CustomTerrain,
  ObjectId,
  Terrain,
  World,
} from "../dist/index.js";

function level(overrides = {}) {
  return {
    width: 6,
    height: 3,
    terrain: [
      Array(6).fill(Terrain.GROUND_C),
      [Terrain.START, ...Array(4).fill(Terrain.GROUND_C), Terrain.EXIT],
      Array(6).fill(Terrain.GROUND_C),
    ],
    objects: [],
    ...overrides,
  };
}

test("Portal 按 channel 配对并保留到 Undo snapshot", () => {
  const world = new World(
    level({
      objects: [
        { type: CustomObjectId.PORTAL, x: 1, y: 1, properties: { channel: "blue" } },
        { type: CustomObjectId.PORTAL, x: 4, y: 1, properties: { channel: "blue" } },
      ],
    }),
  );
  const snapshot = world.snapshot();
  const result = world.move("right");
  assert.equal(result.moved, true);
  assert.deepEqual(world.player, { x: 4, y: 1 });
  assert.equal(result.events.some((event) => event.action === "teleport"), true);
  world.restore(snapshot);
  assert.deepEqual(world.player, { x: 0, y: 1 });
});

test("显式 pushable 对象可推入目标且阻挡连续对象", () => {
  const terrain = level().terrain.map((row) => [...row]);
  terrain[1][2] = CustomTerrain.PUSH_GOAL;
  const world = new World(
    level({
      terrain,
      objects: [
        { type: ObjectId.CRUMBLY_ROCK, x: 1, y: 1, traits: ["pushable"] },
      ],
    }),
  );
  assert.equal(world.move("right").moved, true);
  assert.equal(world.objectIdAt(2, 1), ObjectId.CRUMBLY_ROCK);
  assert.equal(world.objectiveRemaining, 0);

  const blocked = new World(
    level({
      objects: [
        { type: ObjectId.CRUMBLY_ROCK, x: 1, y: 1, traits: ["pushable"] },
        { type: ObjectId.CRUMBLY_ROCK, x: 2, y: 1, traits: ["pushable"] },
      ],
    }),
  );
  assert.equal(blocked.move("right").moved, false);
});

test("pushable Property 不会赋予对象 Trait 能力", () => {
  const world = new World(level({
    objects: [{
      type: ObjectId.CRUMBLY_ROCK,
      x: 1,
      y: 1,
      properties: { pushable: "true" },
    }],
  }));
  assert.equal(world.move("right").moved, false);
  assert.equal(world.objectIdAt(1, 1), ObjectId.CRUMBLY_ROCK);
});

test("maxMoves 在第 N+1 次成功主动移动后触发死亡", () => {
  const world = new World(level({ rules: { maxMoves: 2 } }));
  assert.equal(world.move("right").dead, false);
  assert.equal(world.move("right").dead, false);
  const result = world.move("right");
  assert.equal(result.dead, true);
  assert.equal(world.state.moves, 3);
  assert.equal(world.state.deathReason, "超过最大步数 2");
});

test("推动后的 Actor 通路不合法时 Movement Transaction 保持原状", () => {
  const terrain = level().terrain.map((row) => [...row]);
  terrain[1][1] = Terrain.WATER;
  const world = new World(level({
    terrain,
    objects: [{ type: ObjectId.CRUMBLY_ROCK, x: 1, y: 1, traits: ["pushable"] }],
  }));
  const before = world.snapshot();
  const result = world.move("right");
  assert.equal(result.moved, false);
  assert.deepEqual(world.snapshot(), before);
});

test("Push Goal 与原版目标共同满足后才能从 Exit 完成", () => {
  const terrain = level().terrain.map((row) => [...row]);
  terrain[0][2] = CustomTerrain.PUSH_GOAL;
  const world = new World(level({
    terrain,
    objects: [
      { type: ObjectId.CARROT, x: 1, y: 1 },
      { type: ObjectId.CRUMBLY_ROCK, x: 3, y: 0, traits: ["pushable"] },
    ],
  }));
  for (let step = 0; step < 5; step++) world.move("right");
  assert.equal(world.completed, false);
});
