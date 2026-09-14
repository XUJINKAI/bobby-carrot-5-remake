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

test("MovementPolicy 只接受目标格内的桥接绕过身份", () => {
  const target = [{ entityId: 3, cell: { x: 2, y: 1 }, facts: [], stackOrder: 0 }];
  const plan = createMovementPlan({ ...context, target }, [
    { allowUnwalkable: true, bypassTargetEntityIds: [3] },
  ]);
  assert.deepEqual(plan.bypassTargetEntityIds, [3]);
  assert.throws(
    () => createMovementPlan({ ...context, target }, [
      { bypassTargetEntityIds: [4] },
    ]),
    /目标格以外的 Entity/,
  );
});

test("MovementPolicy 只接受来源格内的生命周期覆盖身份", () => {
  const source = [{ entityId: 5, cell: { x: 1, y: 1 }, facts: [], stackOrder: 0 }];
  const plan = createMovementPlan({ ...context, source }, [
    { bypassSourceLifecycleEntityIds: [5] },
  ]);
  assert.deepEqual(plan.bypassSourceLifecycleEntityIds, [5]);
  assert.throws(
    () => createMovementPlan({ ...context, source }, [
      { bypassSourceLifecycleEntityIds: [6] },
    ]),
    /来源格以外的 Entity/,
  );
});
