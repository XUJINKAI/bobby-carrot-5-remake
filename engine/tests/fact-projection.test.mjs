import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { createBuiltinFactRegistry } from "../dist/fact/builtinFacts.js";
import { FactRegistry } from "../dist/fact/FactRegistry.js";
import { createBuiltinEntityRegistry } from "../dist/entities/registry.js";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";
import { CommandQueue } from "../dist/world/behavior/CommandQueue.js";
import { levelRuleSelector } from "../dist/world/spatial/EntitySelector.js";
import { World } from "./support/World.mjs";
import { testFactRegistry } from "./support/testFactRegistry.mjs";

test("自定义 Entity 使用固定 Fact 校验路径", () => {
  const entities = new EntityRegistry();
  entities.register({ type: "probe", facts: ["probe-active"] });
  const level = {
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [{ type: "probe", x: 0, y: 0 }],
  };

  assert.throws(() => new World(level, { entities }), /未注册 Fact：probe-active/);

  const world = new World(level, {
    entities,
    facts: testFactRegistry("probe-active"),
  });
  assert.equal(world.query.entityHasFact(1, "probe-active"), true);
});

test("Entity Fact 与各 Presence Fact 独立投影并按 Entity 去重", () => {
  const facts = createBuiltinFactRegistry();
  facts.register({ id: "whole-target", description: "对象整体目标" });
  facts.register({ id: "hot", description: "当前发热的部位" });
  const entities = createBuiltinEntityRegistry();
  entities.register({
    type: "fact-probe",
    facts: [],
    entityFacts: ["whole-target"],
    footprint: {
      parts: [
        { dx: 0, dy: 0, role: "head", facts: ["blocking"] },
        { dx: 1, dy: 0, role: "tail", facts: ["walkable"] },
      ],
    },
    resolvePresenceFacts({ entity, presence }) {
      return entity.state?.hot === true && presence.role === "head"
        ? ["hot"]
        : [];
    },
  });
  const world = new World({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      { type: "bobby", x: 0, y: 0 },
      { type: "fact-probe", x: 1, y: 0 },
    ],
  }, { entities, facts });
  const probe = world.entities.all().find((entity) =>
    entity.type === "fact-probe",
  );
  assert.ok(probe);
  const [head, tail] = world.spatial.presencesForEntity(probe.id);
  assert.ok(head);
  assert.ok(tail);
  assert.deepEqual(world.query.entityFacts(probe.id), ["whole-target"]);
  assert.equal(head.facts.includes("whole-target"), false);
  assert.equal(tail.facts.includes("whole-target"), false);
  assert.equal(world.spatial.presenceMatchesSelector(head, levelRuleSelector("whole-target")), true);
  assert.equal(world.spatial.presenceMatchesSelector(tail, levelRuleSelector("whole-target")), true);
  assert.equal(world.spatial.entityCountMatching(levelRuleSelector("whole-target")), 1);
  assert.equal(head.facts.includes("blocking"), true);
  assert.equal(tail.facts.includes("blocking"), false);

  const queue = new CommandQueue();
  queue.setState(probe.id, { hot: true });
  world.committer.commit(queue, { worldTick: null, worldTimeMs: 0 });
  const [updatedHead, updatedTail] = world.spatial.presencesForEntity(probe.id);
  assert.equal(updatedHead.facts.includes("hot"), true);
  assert.equal(updatedTail.facts.includes("hot"), false);
  assert.equal(world.query.entityHasFact(probe.id, "hot"), true);
  assert.throws(() => world.query.entityHasFact(probe.id, "unregistered"));
  assert.equal(world.spatial.entityCountMatching(levelRuleSelector("hot")), 1);
  world.restore(world.snapshot());
  assert.equal(world.query.entityHasFact(probe.id, "hot"), true);
});

test("Fact Registry 拒绝重复和未知标识", () => {
  const registry = new FactRegistry();
  registry.register({ id: "sample", description: "示例事实" });
  assert.throws(() => registry.register({ id: "sample", description: "重复" }));
  assert.throws(() => registry.require("missing"));
});

test("Egg 的阻挡 Fact 随 state 提交刷新", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      { type: MapEntityTypeId.EGG, x: 1, y: 0 },
    ],
  });
  const egg = world.query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.EGG,
  })[0];
  assert.ok(egg);
  assert.equal(egg.instanceFacts, undefined);
  assert.equal(world.query.entityHasFact(egg.id, "blocking"), false);

  const fill = new CommandQueue();
  fill.setState(egg.id, { filled: true });
  world.committer.commit(fill, { worldTick: null, worldTimeMs: 0 });
  assert.equal(world.query.entityHasFact(egg.id, "blocking"), true);
  assert.equal(world.query.entity(egg.id)?.instanceFacts, undefined);

  const clear = new CommandQueue();
  clear.setState(egg.id, { filled: false });
  world.committer.commit(clear, { worldTick: null, worldTimeMs: 0 });
  assert.equal(world.query.entityHasFact(egg.id, "blocking"), false);
});
