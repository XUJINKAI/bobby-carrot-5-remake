import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PRESENTATION_HZ,
  DEFAULT_WORLD_HZ,
  resolveEngineTiming,
} from "../dist/time/EngineTiming.js";
import { PresentationClock } from "../dist/time/PresentationClock.js";
import { WorldClock } from "../dist/time/WorldClock.js";

test("Engine timing has one configurable entry for world and presentation rates", () => {
  assert.equal(DEFAULT_WORLD_HZ, 16);
  assert.equal(DEFAULT_PRESENTATION_HZ, 60);
  assert.deepEqual(resolveEngineTiming(), {
    worldHz: 16,
    worldStepMs: 62.5,
    presentationHz: 60,
    presentationStepMs: 1000 / 60,
  });
  assert.deepEqual(resolveEngineTiming({ worldHz: 20, presentationHz: 16 }), {
    worldHz: 20,
    worldStepMs: 50,
    presentationHz: 16,
    presentationStepMs: 62.5,
  });
});

test("WorldClock uses configurable fixed steps without changing ms semantics", () => {
  const clock = new WorldClock(20);
  const ticks = [];
  assert.equal(clock.stepMs, 50);
  assert.equal(clock.advance(49, (time) => ticks.push(time)), 0);
  assert.equal(clock.advance(1, (time) => ticks.push(time)), 1);
  assert.deepEqual(ticks, [{ tick: 0, stepMs: 50 }]);
});

test("WorldClock pause and debug step affect gameplay time only", () => {
  const clock = new WorldClock();
  const ticks = [];
  clock.pause();
  assert.equal(clock.advance(10_000, (time) => ticks.push(time.tick)), 0);
  assert.equal(clock.step(4, (time) => ticks.push(time.tick)), 4);
  assert.deepEqual(ticks, [0, 1, 2, 3]);
  clock.resume();
  assert.equal(clock.advance(62.5, (time) => ticks.push(time.tick)), 1);
  assert.equal(clock.tickCount, 5);
});

test("PresentationClock samples real time independently from world rate", () => {
  const clock = new PresentationClock(60);
  assert.deepEqual(clock.advance(1000), { frame: 0, nowMs: 1000, deltaMs: 0 });
  assert.equal(clock.advance(1008), null);
  assert.equal(clock.current.nowMs, 1008);
  const frame = clock.advance(1017);
  assert.equal(frame?.frame, 1);
  assert.equal(frame?.nowMs, 1017);
  assert.equal(frame?.deltaMs, 17);
});

test("PresentationClock keeps the requested average rate on a 144Hz RAF source", () => {
  const clock = new PresentationClock(60);
  let samples = 0;
  for (let index = 0; index <= 144; index += 1) {
    if (clock.advance(index * (1000 / 144))) samples += 1;
  }
  assert.ok(samples >= 60 && samples <= 62, `expected ~60Hz, got ${samples}`);
});
