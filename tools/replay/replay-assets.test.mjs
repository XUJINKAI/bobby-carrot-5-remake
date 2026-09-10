import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { runReplay } from "@bobby/engine";
import { parseMapDocument } from "@bobby/model";
import { root } from "../lib/fs.mjs";
import { replayMapFile, replayMapRef } from "./replay-fixture.mjs";

const replayRoot = path.join(root, "assets/replays");
const replayFiles = listFiles(replayRoot);

test("assets/replays 至少包含一个内置过法", () => {
  assert.ok(replayFiles.length > 0);
});

for (const replayFile of replayFiles) {
  const relative = path.relative(replayRoot, replayFile);
  test(`内置过法可在对应地图复跑：${relative}`, () => {
    assert.equal(
      path.extname(relative),
      ".json",
      "assets/replays 只允许存放 Replay JSON",
    );
    const replay = readJson(replayFile);
    const mapRef = replayMapRef(replay);
    const mapFile = replayMapFile(root, replay);
    assert.ok(
      fs.existsSync(mapFile),
      `${relative} 指向的地图不存在：${mapRef.collection}/${mapRef.id}`,
    );

    const expectedStatus = replay?.finalState?.status;
    assert.ok(
      expectedStatus === "playing" ||
        expectedStatus === "won" ||
        expectedStatus === "dead",
      `${relative} 的 finalState.status 无效`,
    );
    const level = parseMapDocument(readJson(mapFile));
    const report = runReplay(level, replay);
    assert.equal(report.endTick, replay.endTick);
    assert.deepEqual(report.actual, replay.finalState);
  });
}

test("Replay fixture 文件名可以独立于关联地图", () => {
  const replay = {
    meta: {
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
    assert.throws(() => replayMapRef({ meta: { url } }), /Replay meta\.url/);
  }
});

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(file) : [file];
    })
    .sort();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
