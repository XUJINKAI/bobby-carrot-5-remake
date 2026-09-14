import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { GoalRegistry } from "../dist/world/outcome/GoalRegistry.js";
import { CommandQueue } from "../dist/world/behavior/CommandQueue.js";
import { World } from "./support/World.mjs";

const ground = (x, y) => ({ type: MapEntityTypeId.GRASS, x, y, variant: "ts-10-1" });

function level(entities, win, width = 3) {
  return {
    schemaVersion: 1,
    width,
    height: 1,
    entities: [
      ...Array.from({ length: width }, (_, x) => ground(x, 0)),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      ...entities,
    ],
    rules: { win },
  };
}

test("Goal Registry 拒绝重复定义并报告缺失定义", () => {
  const registry = new GoalRegistry();
  const definition = {
    type: "carrot",
    available: () => true,
    evaluate: () => ({ completed: true }),
  };
  registry.register(definition);
  assert.throws(() => registry.register(definition), /重复 Goal/);
  assert.throws(() => registry.require("egg"), /未注册 Goal/);
  assert.throws(
    () => new World(level([], { type: "egg" }), { goals: registry }).winState,
    /未注册 Goal/,
  );
});

test("Carrot 的空目标结果与高草下对象计数一致", () => {
  const empty = new World(level([], { type: "carrot" }));
  assert.deepEqual(empty.winState, { type: "carrot", completed: true, remaining: 0 });

  const hidden = new World(level([
    { type: MapEntityTypeId.CARROT, x: 1, y: 0 },
    { type: MapEntityTypeId.HIGH_GRASS, x: 1, y: 0 },
  ], { type: "carrot" }));
  assert.deepEqual(hidden.winState, { type: "carrot", completed: false, remaining: 1 });
});

test("Egg 按 Entity ID 计数，填充状态可由 Snapshot 恢复", () => {
  const world = new World(level([
    { type: MapEntityTypeId.EGG, x: 1, y: 0 },
    { type: MapEntityTypeId.EGG, x: 1, y: 0, filled: true },
  ], { type: "egg" }));
  assert.equal(world.winState.remaining, 1);
  const snapshot = world.snapshot();
  const egg = world.query.entitiesMatching({ kind: "type", value: MapEntityTypeId.EGG })[0];
  const commands = new CommandQueue();
  commands.setState(egg.id, { filled: true });
  world.committer.commit(commands, { worldTick: null, worldTimeMs: 0 });
  assert.deepEqual(world.winState, { type: "egg", completed: true, remaining: 0 });
  world.restore(snapshot);
  assert.deepEqual(world.winState, { type: "egg", completed: false, remaining: 1 });
});

test("Push Goal 按目标格去重，读取当前位置的 pushable", () => {
  const world = new World(level([
    { type: MapEntityTypeId.PUSH_GOAL, x: 1, y: 0 },
    { type: MapEntityTypeId.PUSH_GOAL, x: 1, y: 0 },
    { type: MapEntityTypeId.PUSHABLE_BOX, x: 1, y: 0 },
  ], { type: "push-goal" }));
  assert.deepEqual(world.winState, { type: "push-goal", completed: true, remaining: 0 });
});

test("Exit 要求所有玩家各自到达任意 Exit", () => {
  const world = new World(level([
    { type: MapEntityTypeId.EXIT, x: 0, y: 0 },
    { type: MapEntityTypeId.EXIT, x: 2, y: 0 },
    { type: MapEntityTypeId.BOBBY, x: 1, y: 0 },
  ], { type: "exit" }));
  assert.equal(world.winState.completed, false);
  const secondary = world.query.entitiesWithFact("player")[1];
  const commands = new CommandQueue();
  commands.relocate(secondary.id, 2, 0);
  world.committer.commit(commands, { worldTick: null, worldTimeMs: 0 });
  assert.equal(world.winState.completed, true);
});
