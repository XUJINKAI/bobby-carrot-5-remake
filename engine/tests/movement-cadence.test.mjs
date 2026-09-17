import test from "node:test";
import assert from "node:assert/strict";
import {
  BEAN_GROWTH_TIMING,
  BOBBY_MOVEMENT,
  BOBBY_MOVEMENT_CADENCE,
  CLOUD_MOVEMENT,
  FIREBALL_MOVEMENT,
  ICE_MOVEMENT,
  KITE_FLIGHT_MOVEMENT,
  LEAF_MOVEMENT,
  MOWER_MOVEMENT,
  ORIGINAL_MOVEMENT_CADENCE,
  SPEED_MOVEMENT,
  resolveActionMovementCadenceMs,
} from "../dist/entities/movement/MovementCadence.js";

test("MovementCadence 集中声明四档基准与各 Entity 的独有配置", () => {
  assert.deepEqual(ORIGINAL_MOVEMENT_CADENCE, {
    slowCellMs: 416,
    fastCellMs: 208,
  });
  assert.deepEqual(BOBBY_MOVEMENT_CADENCE, {
    normalCellMs: 350,
    fastCellMs: 175,
  });

  assert.deepEqual(BOBBY_MOVEMENT, {
    normalCellMs: 350,
    speedShoesCellMs: 175,
    quantizeActionMotion: false,
  });
  assert.deepEqual(MOWER_MOVEMENT, {
    normalCellMs: 350,
    speedCellMs: 175,
    quantizeActionMotion: false,
  });
  assert.deepEqual(ICE_MOVEMENT, {
    normalCellMs: 350,
    fastCellMs: 175,
    inheritsEnteringMotion: true,
    quantizeActionMotion: false,
  });
  assert.deepEqual(SPEED_MOVEMENT, {
    full: { cellMs: 175, quantizeActionMotion: true },
    normalRunoutCellMs: 350,
  });
  assert.deepEqual(CLOUD_MOVEMENT, {
    cellMs: 416,
    quantizeActionMotion: true,
  });
  assert.deepEqual(LEAF_MOVEMENT, {
    normal: { cellMs: 416, quantizeActionMotion: true },
    waterfall: { cellMs: 208, quantizeActionMotion: true },
  });
  assert.deepEqual(KITE_FLIGHT_MOVEMENT, {
    cellMs: 208,
    quantizeActionMotion: true,
  });
  assert.deepEqual(FIREBALL_MOVEMENT, {
    cellMs: 208,
    frameMs: 104,
    terminalMs: 104,
    quantizeActionMotion: true,
  });
  assert.deepEqual(BEAN_GROWTH_TIMING, {
    segmentMs: 416,
    quantizeActionMotion: false,
  });
});

test("启用量化的 Entity 在不同 World Hz 下连续 100 段只保留一拍内误差", () => {
  const movements = [
    SPEED_MOVEMENT.full,
    CLOUD_MOVEMENT,
    LEAF_MOVEMENT.normal,
    LEAF_MOVEMENT.waterfall,
    KITE_FLIGHT_MOVEMENT,
    FIREBALL_MOVEMENT,
  ];

  for (const movement of movements) {
    for (const hz of [30, 60, 120]) {
      const stepMs = 1000 / hz;
      const action = { id: 1, kind: "cadence-test", state: {} };
      let durationMs = 0;
      for (let cell = 0; cell < 100; cell += 1) {
        durationMs += resolveActionMovementCadenceMs(
          action,
          movement,
          stepMs,
        );
      }
      const expectedMs = 100 * movement.cellMs;
      assert.ok(
        Math.abs(durationMs - expectedMs) <= stepMs + 0.01,
        `${movement.cellMs}ms at ${hz}Hz: expected ${expectedMs}, got ${durationMs}`,
      );
    }
  }
});
