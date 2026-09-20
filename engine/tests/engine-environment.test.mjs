import assert from "node:assert/strict";
import test from "node:test";
import {
  GameplaySession,
  createEngineEnvironment,
  defineEntityModule,
} from "../dist/public.js";
import { cloud } from "../dist/entities/original/cloud.js";

test("EngineEnvironment 为 Session 与查询交付同一份能力组合", () => {
  const module = defineEntityModule({
    definition: {
      type: "environment-probe",
      presenceFacts: ["walkable"],
      presentation: { name: "Environment Probe" },
    },
  });
  const environment = createEngineEnvironment({ modules: [module] });
  const session = new GameplaySession({ environment });

  session.loadLevel({
    schemaVersion: 1,
    meta: { name: "Environment" },
    width: 1,
    height: 1,
    entities: [{ type: "environment-probe", x: 0, y: 0 }],
  });

  assert.equal(Object.isFrozen(environment), true);
  assert.equal(environment.catalog.has("environment-probe"), true);
  assert.equal(session.world.query.entitiesWithFact("walkable").length, 1);
});

test("EngineEnvironment 在组合时拒绝未声明的 Fact", () => {
  const module = defineEntityModule({
    definition: {
      type: "invalid-environment-probe",
      presenceFacts: ["missing-fact"],
      presentation: { name: "Invalid Environment Probe" },
    },
  });

  assert.throws(
    () => createEngineEnvironment({ modules: [module] }),
    /未注册 Fact：missing-fact/,
  );
});

test("Cloud 模块独立组合时注册自己的共享移动 Action", () => {
  const environment = createEngineEnvironment({ modules: [cloud] });
  const session = new GameplaySession({ environment });
  session.loadLevel({
    schemaVersion: 1,
    meta: { name: "Cloud-only Environment" },
    width: 1,
    height: 1,
    entities: [{ type: "cloud", x: 0, y: 0, color: "red" }],
  });

  assert.equal(environment.actions.require("moving-entity").kind, "moving-entity");
  assert.doesNotThrow(() => session.advanceTicks(2));
});
