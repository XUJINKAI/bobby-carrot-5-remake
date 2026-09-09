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
  assert.equal(DEFAULT_WORLD_HZ, 60);
  assert.equal(DEFAULT_PRESENTATION_HZ, 60);
  assert.deepEqual(resolveEngineTiming(), {
    worldHz: 60,
    worldStepMs: 1000 / 60,
    presentationHz: 60,
    presentationStepMs: 1000 / 60,
    worldSpeed: 1,
    presentationSpeed: 1,
  });
  assert.deepEqual(resolveEngineTiming({ worldHz: 20, presentationHz: 16 }), {
    worldHz: 20,
    worldStepMs: 50,
    presentationHz: 16,
    presentationStepMs: 62.5,
    worldSpeed: 1,
    presentationSpeed: 1,
  });
});

test("Engine timing resolves independent World and Presentation speeds", () => {
  assert.deepEqual(
    resolveEngineTiming({ worldSpeed: 4, presentationSpeed: 0.5 }),
    {
      worldHz: 60,
      worldStepMs: 1000 / 60,
      presentationHz: 60,
      presentationStepMs: 1000 / 60,
      worldSpeed: 4,
      presentationSpeed: 0.5,
    },
  );
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
  assert.equal(clock.advance(1000 / 60, (time) => ticks.push(time.tick)), 1);
  assert.equal(clock.tickCount, 5);
});

test("WorldClock speed changes real-time tick consumption without changing stepMs", () => {
  const clock = new WorldClock(16, 2);
  const ticks = [];
  assert.equal(clock.advance(62.5, (time) => ticks.push(time)), 2);
  assert.deepEqual(ticks.map((time) => time.tick), [0, 1]);
  assert.ok(ticks.every((time) => time.stepMs === 62.5));
  clock.setSpeed(0.5);
  assert.equal(clock.advance(62.5, (time) => ticks.push(time)), 0);
  assert.equal(clock.advance(62.5, (time) => ticks.push(time)), 1);
});

test("WorldClock 8x remains effective at a 60Hz World rate", () => {
  const clock = new WorldClock(60, 8);
  const ticks = [];
  assert.equal(clock.advance(17, (time) => ticks.push(time.tick)), 8);
  assert.deepEqual(ticks, [0, 1, 2, 3, 4, 5, 6, 7]);
});

test("WorldClock can change Hz while keeping the logical tick sequence", () => {
  const clock = new WorldClock(16);
  clock.pause();
  clock.step(2, () => {});
  clock.setHz(20);
  assert.equal(clock.hz, 20);
  assert.equal(clock.stepMs, 50);
  assert.equal(clock.tickCount, 2);
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

test("PresentationClock pause ignores real elapsed time and steps both directions", () => {
  const clock = new PresentationClock(60);
  clock.advance(1000);
  const sampled = clock.advance(1017);
  assert.equal(sampled?.frame, 1);
  const beforePause = clock.current;

  clock.pause();
  assert.equal(clock.paused, true);
  assert.equal(clock.advance(5000), null);
  assert.equal(clock.current.frame, beforePause.frame);
  assert.equal(clock.current.nowMs, beforePause.nowMs);

  const back = clock.step(-1);
  assert.equal(back?.frame, 0);
  assert.ok((back?.deltaMs ?? 0) < 0);
  const forward = clock.step(1);
  assert.equal(forward?.frame, 1);
  assert.ok((forward?.deltaMs ?? 0) > 0);

  clock.resume();
  assert.equal(clock.paused, false);
  assert.equal(clock.advance(5010), null);
  assert.ok(clock.current.nowMs < 1030);
});

test("PresentationClock applies speed independently from sampling Hz", () => {
  const clock = new PresentationClock(60, 2);
  clock.advance(1000);
  const frame = clock.advance(1017);
  assert.ok(frame);
  assert.ok(frame.nowMs >= 1034);
  assert.ok(frame.deltaMs >= 34);
  clock.setHz(20);
  assert.equal(clock.stepMs, 50);
  clock.setSpeed(0.5);
  assert.equal(clock.speed, 0.5);
});
