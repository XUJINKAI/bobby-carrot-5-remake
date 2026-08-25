import test from "node:test";
import assert from "node:assert/strict";
import { ObjectId } from "../../model/dist/index.js";
import {
  TimedChallenge,
  timedChallengeDuration,
} from "../dist/core/TimedChallenge.js";

function event(type, extra = {}) {
  return { type, ...extra };
}

test("timed challenge parses positive millisecond properties only", () => {
  assert.equal(timedChallengeDuration("60000"), 60_000);
  assert.equal(timedChallengeDuration("1000.9"), 1000);
  assert.equal(timedChallengeDuration(undefined), null);
  assert.equal(timedChallengeDuration(""), null);
  assert.equal(timedChallengeDuration("0"), null);
  assert.equal(timedChallengeDuration("not-a-number"), null);
});

test("timed Lock starts, advances and expires inside Engine", () => {
  const challenge = new TimedChallenge();
  const lock = {
    type: ObjectId.LOCK,
    x: 2,
    y: 3,
    properties: { timedChallengeMs: "60000" },
  };
  const objectAt = (x, y) => (x === 2 && y === 3 ? lock : null);

  challenge.handleWorldEvent(
    event("object-interaction", {
      objectType: ObjectId.LOCK,
      action: "open",
      x: 2,
      y: 3,
    }),
    objectAt,
  );
  assert.equal(challenge.remainingMs, 60_000);
  assert.equal(challenge.advance(59_999), false);
  assert.equal(challenge.remainingMs, 1);
  assert.equal(challenge.advance(1), true);
  assert.equal(challenge.remainingMs, null);
});

test("golden carrot, death and completion clear the active challenge", () => {
  const challenge = new TimedChallenge();
  const lock = {
    type: ObjectId.LOCK,
    x: 1,
    y: 0,
    properties: { timedChallengeMs: "5000" },
  };
  const objectAt = () => lock;
  const open = event("object-interaction", {
    objectType: ObjectId.LOCK,
    action: "open",
    x: 1,
    y: 0,
  });

  challenge.handleWorldEvent(open, objectAt);
  challenge.handleWorldEvent(event("collect-golden-carrot"), objectAt);
  assert.equal(challenge.remainingMs, null);

  challenge.handleWorldEvent(open, objectAt);
  challenge.handleWorldEvent(event("death"), objectAt);
  assert.equal(challenge.remainingMs, null);

  challenge.handleWorldEvent(open, objectAt);
  challenge.handleWorldEvent(event("complete"), objectAt);
  assert.equal(challenge.remainingMs, null);
});

test("challenge snapshot can be restored with Game undo state", () => {
  const challenge = new TimedChallenge();
  challenge.restore(12_345);
  const snapshot = challenge.snapshot();
  challenge.advance(345);
  assert.equal(challenge.remainingMs, 12_000);
  challenge.restore(snapshot);
  assert.equal(challenge.remainingMs, 12_345);
});
