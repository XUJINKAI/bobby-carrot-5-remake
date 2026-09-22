import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { root } from "../../../tools/lib/fs.mjs";

test("clean 清理根目录和全部 workspace dist 与 TypeScript 构建状态", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bc5r-clean-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  copy(directory, "tools/pipeline/clean.mjs");
  copy(directory, "tools/lib/fs.mjs");
  fs.writeFileSync(
    path.join(directory, "package.json"),
    JSON.stringify({ workspaces: ["model", "future-package"] }),
  );
  for (const relative of [
    "dist/index.js",
    "model/dist/index.js",
    "future-package/dist/index.js",
    "future-package/tsconfig.tsbuildinfo",
    "assets/maps/index.json",
    "original/adapted/catalog.json",
    "tmp/assets-prepare/state.json",
    "node_modules/dependency/dist/index.js",
    "examples/fixture/dist/index.js",
  ]) {
    const target = path.join(directory, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, "generated");
  }

  const result = spawnSync(process.execPath, ["tools/pipeline/clean.mjs"], {
    cwd: directory,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(directory, "dist")), false);
  assert.equal(fs.existsSync(path.join(directory, "model/dist")), false);
  assert.equal(
    fs.existsSync(path.join(directory, "future-package/dist")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(directory, "future-package/tsconfig.tsbuildinfo")),
    false,
  );
  assert.equal(fs.existsSync(path.join(directory, "assets/maps")), false);
  assert.equal(fs.existsSync(path.join(directory, "original/adapted")), false);
  assert.equal(
    fs.existsSync(path.join(directory, "tmp/assets-prepare")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(directory, "node_modules/dependency/dist/index.js")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(directory, "examples/fixture/dist/index.js")),
    true,
  );
});

function copy(directory, relative) {
  const target = path.join(directory, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, relative), target);
}
