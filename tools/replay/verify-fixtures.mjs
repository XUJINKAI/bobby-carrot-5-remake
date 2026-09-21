import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { replayVerificationStates, runReplay } from "@bobby/engine";
import { parseMapDocument } from "@bobby/model";
import { root } from "../lib/fs.mjs";
import {
  replayFixtureFiles,
  replayRoot,
} from "./fixture-files.mjs";
import { replayMapFile, replayMapRef } from "./replay-fixture.mjs";

export { replayFixtureFiles };

export function verifyReplayFixture(replayFile) {
  const relative = path.relative(replayRoot, replayFile);
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

  const level = parseMapDocument(readJson(mapFile));
  const report = runReplay(level, replay);
  assert.equal(report.endTick, replay.endTick, relative);
  assertReplayReachedFinalState(
    relative,
    report.actual.status,
    replay.finalState?.status,
  );
  const verification = replayVerificationStates(
    report.actual,
    replay.finalState,
  );
  assert.deepEqual(verification.actual, verification.expected, relative);
  return {
    mapRef,
    winning: replay.finalState?.status === "won" &&
      report.actual.status === "won",
  };
}

export function assertReplayReachedFinalState(relative, actual, expected) {
  assert.notEqual(
    expected,
    undefined,
    `${relative}: 仓库 Replay 必须声明 finalState.status`,
  );
  assert.equal(
    actual,
    expected,
    `${relative}: Replay 实际状态必须匹配 finalState.status`,
  );
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
