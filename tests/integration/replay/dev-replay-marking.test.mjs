import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { root } from "../../../tools/lib/fs.mjs";

test("开发标记只根据 Replay 文件关联地图且不依赖 Engine 产物", (t) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "bc5r-replay-presence-"),
  );
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  for (const relative of [
    "tools/lib/fs.mjs",
    "tools/replay/fixture-files.mjs",
    "tools/replay/mark-verified-maps.mjs",
    "tools/replay/replay-fixture.mjs",
  ]) {
    copy(directory, relative);
  }
  writeJson(path.join(directory, "assets/maps/sample/index.json"), {
    schemaVersion: 1,
    maps: [
      { id: "has-replay", name: "有 Replay" },
      { id: "without-replay", name: "无 Replay", verified: true },
    ],
  });
  writeJson(path.join(directory, "assets/replays/take.json"), {
    meta: {
      id: "sample/has-replay",
      url: "https://bc5r.xujinkai.net/explore/play/sample/has-replay",
    },
    finalState: { status: "dead" },
  });

  const result = spawnSync(
    process.execPath,
    ["tools/replay/mark-verified-maps.mjs", "--presence"],
    { cwd: directory, encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  const index = readJson(
    path.join(directory, "assets/maps/sample/index.json"),
  );
  assert.equal(index.maps[0].verified, true);
  assert.equal("verified" in index.maps[1], false);
  assert.equal(fs.existsSync(path.join(directory, "engine/dist")), false);
});

function copy(directory, relative) {
  const target = path.join(directory, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, relative), target);
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
