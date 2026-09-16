import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { createEngineEnvironment } from "../dist/environment/EngineEnvironment.js";
import { createWorld } from "../dist/entities/WorldComposition.js";
import { builtinEntityModules } from "../dist/entities/registry.js";
import { createBuiltinFactRegistry } from "../dist/fact/builtinFacts.js";
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

test("Carrot Goal 按未收集对象计数并随 Snapshot 恢复", () => {
  const world = new World(level([
    { type: MapEntityTypeId.CARROT, x: 1, y: 0 },
    { type: MapEntityTypeId.CARROT, x: 2, y: 0 },
  ], { type: "carrot" }));
  const carrots = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.CARROT,
  });
  const snapshot = world.snapshot();
  const first = new CommandQueue();
  first.setState(carrots[0].id, { consumed: true });
  world.committer.commit(first, { worldTick: null, worldTimeMs: 0 });
  assert.deepEqual(world.winState, { type: "carrot", completed: false, remaining: 1 });

  const second = new CommandQueue();
  second.setState(carrots[1].id, { consumed: true });
  world.committer.commit(second, { worldTick: null, worldTimeMs: 0 });
  assert.deepEqual(world.winState, { type: "carrot", completed: true, remaining: 0 });
  assert.equal(world.query.entityCountMatching({ kind: "type", value: MapEntityTypeId.CARROT }), 2);

  world.restore(snapshot);
  assert.deepEqual(world.winState, { type: "carrot", completed: false, remaining: 2 });
});

test("Golden Carrot Goal 读取已提交的收集记录并随 Snapshot 恢复", () => {
  const world = new World(level([
    { type: MapEntityTypeId.GOLDEN_CARROT, x: 1, y: 0 },
  ], { type: "golden-carrot" }));
  const actor = world.query.entitiesWithFact("player")[0];
  const snapshot = world.snapshot();

  assert.equal(world.winState.completed, false);
  const result = world.step({
    intents: [{
      type: "move",
      actorId: actor.id,
      direction: "right",
      cause: { type: "player-input" },
    }],
  });
  assert.equal(result.events.some((event) => event.type === "collect-golden-carrot"), true);
  assert.deepEqual(world.state.successfulGoalInteractions, [MapEntityTypeId.GOLDEN_CARROT]);
  assert.equal(world.winState.completed, true);

  world.restore(snapshot);
  assert.deepEqual(world.state.successfulGoalInteractions, []);
  assert.equal(world.winState.completed, false);
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

test("Exit 只接受 Exit Type，不接受同名 Fact", () => {
  const facts = createBuiltinFactRegistry();
  facts.register({ id: "exit", description: "测试同名 Fact 不冒充 Exit 身份" });
  const environment = createEngineEnvironment({
    facts,
    modules: [
      ...builtinEntityModules,
      {
        definition: {
          type: "false-exit",
          presenceFacts: ["walkable", "exit"],
        },
        presentation: { name: "False Exit" },
      },
    ],
  });
  const world = createWorld({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      { type: "false-exit", x: 0, y: 0 },
      { type: MapEntityTypeId.EXIT, x: 1, y: 0 },
    ],
    rules: { win: { type: "exit" } },
  }, environment);

  assert.equal(world.winState.completed, false);
});
