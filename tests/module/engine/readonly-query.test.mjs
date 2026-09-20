import test from "node:test";
import assert from "node:assert/strict";
import { BehaviorRegistry } from "../../../engine/dist/world/behavior/BehaviorRegistry.js";
import { EntityRegistry } from "../../../engine/dist/world/entity/EntityRegistry.js";
import { World } from "../../support/engine/World.mjs";
import { testFactRegistry } from "../../support/engine/testFactRegistry.mjs";

test("Fact resolver、Behavior 和 WorldQuery 无法修改已提交的 Entity 与 Presence", () => {
  let observedHook = false;
  const behaviors = new BehaviorRegistry();
  behaviors.register({
    id: "probe",
    onInitialize({ self, query }) {
      observedHook = true;
      assert.equal(Reflect.set(self.entity.anchor, "x", 9), false);
      assert.equal(Reflect.set(self.presence.cell, "x", 9), false);
      const queried = query.entity(self.entity.id);
      assert.equal(Reflect.set(queried.anchor, "x", 9), false);
      assert.equal(Reflect.set(query.presencesAt({ x: 1, y: 0 }), 0, null), false);
      assert.equal(Reflect.set(query.allPresencesAt({ x: 1, y: 0 }), 0, null), false);
    },
  });
  const entities = new EntityRegistry();
  entities.register({
    type: "probe",
    presenceFacts: [],
    behaviors: ["probe"],
    resolvePresenceFacts({ entity }) {
      assert.equal(Reflect.set(entity.anchor, "x", 9), false);
      return entity.state?.active === true ? ["active"] : [];
    },
  });
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [{ type: "probe", x: 1, y: 0 }],
  }, { entities, behaviors, facts: testFactRegistry("active") });
  const entity = world.entities.all()[0];
  assert.equal(observedHook, true);
  assert.deepEqual(entity.anchor, { x: 1, y: 0 });
  assert.equal(world.spatial.hasFactAt({ x: 1, y: 0 }, "active"), false);
  entity.state = { active: true };
  world.spatial.rebuildEntity(entity.id);
  assert.equal(Reflect.set(world.query.entity(entity.id).state, "active", false), false);
  assert.equal(world.spatial.hasFactAt({ x: 1, y: 0 }, "active"), true);
  const presence = world.query.topPresenceAt({ x: 1, y: 0 });
  assert.ok(presence);
  assert.equal(Reflect.set(presence, "layer", "cover"), false);
  assert.equal(Object.hasOwn(world.spatial.topPresenceAt({ x: 1, y: 0 }), "layer"), false);
  assert.equal(Reflect.set(world.query.global(), "moves", 99), false);
  assert.equal(world.state.moves, 0);
});
