import test from "node:test";
import assert from "node:assert/strict";
import { createMovementPlan } from "../dist/world/movement/MovementPlan.js";

const context = {
  actor: { id: 1, type: "test-actor", anchor: { x: 1, y: 1 } },
  query: {},
  direction: "right",
  from: { x: 1, y: 1 },
  to: { x: 2, y: 1 },
  cause: { type: "actor" },
  source: [],
  target: [],
};

test("MovementPolicy 合并为单一 MovementPlan", () => {
  const plan = createMovementPlan(context, [
    {
      passage: "unrestricted",
      updateDirection: false,
      reason: "test-passage",
    },
    {
      companions: [
        {
          entityId: 2,
          to: { x: 2, y: 1 },
          cause: { type: "carry", carrierId: 1 },
        },
      ],
    },
  ]);

  assert.equal(plan.passage, "unrestricted");
  assert.equal(plan.updateDirection, false);
  assert.equal(plan.reason, "test-passage");
  assert.deepEqual(plan.companions, [
    {
      entityId: 2,
      to: { x: 2, y: 1 },
      cause: { type: "carry", carrierId: 1 },
    },
  ]);
});

test("MovementPolicy 拒绝相互冲突的规则", () => {
  assert.throws(
    () =>
      createMovementPlan(context, [
        { passage: "standard" },
        { passage: "unrestricted" },
      ]),
    /passage.*冲突/,
  );
});
