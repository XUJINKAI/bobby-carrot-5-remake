import test from "node:test";
import assert from "node:assert/strict";
import {
  ENGINE_TICK_RATE,
  ENGINE_TICK_STEP_MS,
  EngineClock,
} from "../dist/time/EngineClock.js";

test("EngineClock 默认固定为 16Hz / 62.5ms", () => {
  assert.equal(ENGINE_TICK_RATE, 16);
  assert.equal(ENGINE_TICK_STEP_MS, 62.5);
  assert.equal(new EngineClock().stepMs, 62.5);
});

test("EngineClock 用 accumulator 产出连续固定 Tick", () => {
  const clock = new EngineClock();
  const ticks = [];
  assert.equal(clock.advance(60, (time) => ticks.push(time)), 0);
  assert.equal(clock.advance(2.5, (time) => ticks.push(time)), 1);
  assert.equal(clock.advance(125, (time) => ticks.push(time)), 2);
  assert.deepEqual(ticks, [
    { tick: 0, stepMs: 62.5 },
    { tick: 1, stepMs: 62.5 },
    { tick: 2, stepMs: 62.5 },
  ]);
});

test("EngineClock 单次最多追赶 4 Tick，后台长停顿不会形成更新风暴", () => {
  const clock = new EngineClock();
  const ticks = [];
  assert.equal(clock.advance(60_000, (time) => ticks.push(time.tick)), 4);
  assert.deepEqual(ticks, [0, 1, 2, 3]);
  assert.deepEqual(clock.nextTick, { tick: 4, stepMs: 62.5 });
});
