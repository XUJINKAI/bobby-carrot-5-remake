import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { root } from "../lib/fs.mjs";
import { replayMapFile, replayMapRef } from "./replay-fixture.mjs";
import {
  assertReplayReachedFinalState,
  replayFixtureFiles,
  verifyReplayFixture,
} from "./verify-fixtures.mjs";

const replayRoot = path.join(root, "assets/replays");
const replayFiles = replayFixtureFiles();

test("assets/replays 至少包含一个内置 Replay", () => {
  assert.ok(replayFiles.length > 0);
});

for (const replayFile of replayFiles) {
  const relative = path.relative(replayRoot, replayFile);
  test(`内置 Replay 可复跑至声明的 finalState：${relative}`, () => {
    verifyReplayFixture(replayFile);
  });
}

test("内置 Replay 的实际状态必须匹配声明的 finalState.status", () => {
  for (const status of ["playing", "won", "dead"])
    assert.doesNotThrow(() =>
      assertReplayReachedFinalState(`${status}.json`, status, status),
    );
  assert.throws(
    () => assertReplayReachedFinalState("missing.json", "playing", undefined),
    /必须声明 finalState\.status/,
  );
  assert.throws(
    () => assertReplayReachedFinalState("mismatch.json", "won", "playing"),
    /实际状态必须匹配 finalState\.status/,
  );
});

test("Replay fixture 文件名可以独立于关联地图", () => {
  const replay = {
    meta: {
      id: "original/1-1",
      url: "https://bc5r.xujinkai.net/explore/play/original/1-1?take=fast#finish",
    },
  };
  assert.deepEqual(replayMapRef(replay), {
    collection: "original",
    id: "1-1",
  });
  assert.equal(
    replayMapFile(root, replay),
    path.join(root, "assets/maps/original/1-1.json"),
  );
});

test("Replay fixture 只接受正式 Explore 地图 URL", () => {
  for (const url of [
    "https://example.com/explore/play/original/1-1",
    "https://bc5r.xujinkai.net/adventure/chapter/1/level/1-1",
    "https://bc5r.xujinkai.net/explore/play/original/../1-1",
  ]) {
    assert.throws(
      () => replayMapRef({ meta: { id: "original/1-1", url } }),
      /Replay meta\.url|指向的地图不一致/,
    );
  }
});

test("Replay fixture 要求路径 ID 与地图 URL 一致", () => {
  assert.throws(
    () => replayMapRef({
      meta: {
        id: "original/1-2",
        url: "https://bc5r.xujinkai.net/explore/play/original/1-1",
      },
    }),
    /指向的地图不一致/,
  );
});
