import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { runReplay } from "@bobby/engine";
import { parseMapDocument } from "@bobby/model";
import { root } from "../lib/fs.mjs";

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
    const mapFile = path.join(root, "assets/maps", relative);
    assert.ok(
      fs.existsSync(mapFile),
      `${relative} 缺少对应地图 assets/maps/${relative}`,
    );

    const replay = readJson(replayFile);
    assert.equal(
      new URL(replay?.meta?.url).origin,
      "https://bc5r.xujinkai.net",
      `${relative} 的 meta.url 必须使用正式站点`,
    );
    const expectedStatus = replay?.meta?.final_status;
    assert.ok(
      expectedStatus === "playing" ||
        expectedStatus === "won" ||
        expectedStatus === "dead",
      `${relative} 的 meta.final_status 无效`,
    );
    const level = parseMapDocument(readJson(mapFile));
    const report = runReplay(level, replay);
    assert.equal(report.actual.endTick, replay.endTick);
    assert.equal(report.actual.status, expectedStatus);
  });
}

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
