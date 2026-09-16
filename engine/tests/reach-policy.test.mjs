import test from "node:test";
import assert from "node:assert/strict";
import { BehaviorRegistry } from "../dist/world/behavior/BehaviorRegistry.js";
import { ReachResolver } from "../dist/world/outcome/ReachResolver.js";
import { MechanismRegistry } from "../dist/mechanism/MechanismRegistry.js";
import { EntityRegistry } from "../dist/world/entity/EntityRegistry.js";

test("ReachResolver 通过目标 Behavior 判断 actor 资格", () => {
  const behavior = {
    id: "requires-token",
    canReach({ actor }) {
      return actor.state?.token === true
        ? { passable: true }
        : { passable: false, reason: "missing-token" };
    },
  };
  const behaviors = new BehaviorRegistry();
  behaviors.register(behavior);
  const entities = new EntityRegistry();
  entities.register({ type: "goal", presenceFacts: [], behaviors: [behavior.id] });
  const target = { id: 2, type: "goal", anchor: { x: 1, y: 0 } };
  const presence = {
    entityId: 2,
    cell: { x: 1, y: 0 },
    facts: [],
    stackOrder: 0,
  };
  const query = {
    entity(id) {
      return id === target.id ? target : undefined;
    },
    presencesAt() {
      return [presence];
    },
    presenceMatchesSelector(candidate, selector) {
      return candidate.entityId === target.id &&
        selector.kind === "type" && selector.value === target.type;
    },
  };
  const resolver = new ReachResolver(
    query,
    entities,
    behaviors,
    new MechanismRegistry(),
  );

  assert.equal(
    resolver.actorReaches(
      { id: 1, type: "actor", anchor: { x: 1, y: 0 } },
      { kind: "type", value: "goal" },
    ),
    false,
  );
  assert.equal(
    resolver.actorReaches(
      {
        id: 1,
        type: "actor",
        anchor: { x: 1, y: 0 },
        state: { token: true },
      },
      { kind: "type", value: "goal" },
    ),
    true,
  );
});
