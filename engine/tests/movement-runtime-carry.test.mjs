import test from "node:test";
import assert from "node:assert/strict";
import { MovementRuntime } from "../dist/world/movement/MovementRuntime.js";

const visitor = {
  progressed() {},
  marker() {},
  completed() {},
};

function moveRequest(entityId, cause) {
  return {
    entityId,
    from: { x: 0, y: 0 },
    to: { x: 1, y: 0 },
    direction: "right",
    cause,
  };
}

test("carry companion inherits carrier duration and progress", () => {
  for (const carrierDurationMs of [496, 248]) {
    const movement = new MovementRuntime();
    const carrierId = 7;
    const passengerId = 8;

    movement.start(
      moveRequest(carrierId, {
        type: "forced",
        mechanism: "leaf",
        cadenceMs: carrierDurationMs,
      }),
      carrierDurationMs,
    );
    movement.start(
      moveRequest(passengerId, { type: "carry", carrierId }),
      350,
    );

    assert.equal(
      movement.motions.forEntity(passengerId).durationMs,
      carrierDurationMs,
    );

    movement.advance(carrierDurationMs / 2, visitor);
    const carrier = movement.motions.forEntity(carrierId);
    const passenger = movement.motions.forEntity(passengerId);
    assert.equal(carrier.progress, 0.5);
    assert.equal(passenger.progress, carrier.progress);
    assert.deepEqual(
      movement.motions.poseFor(passengerId, { x: 1, y: 0 }),
      movement.motions.poseFor(carrierId, { x: 1, y: 0 }),
    );

    movement.advance(carrierDurationMs / 2, visitor);
    assert.equal(movement.motions.forEntity(carrierId), undefined);
    assert.equal(movement.motions.forEntity(passengerId), undefined);
  }
});
