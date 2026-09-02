import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");

test("目录 patch 按 Campaign ID 合并生成对应原版 JAR", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "bc5r-patch-"));
  const input = path.join(temporary, "in");
  const outputRoot = path.join(root, "tmp", path.basename(temporary));
  const output = path.join(outputRoot, "out");
  fs.mkdirSync(input);
  try {
    fs.copyFileSync(
      path.join(root, "assets/maps/original/1-1.json"),
      path.join(input, "1-1.json"),
    );
    fs.copyFileSync(
      path.join(root, "assets/maps/original/5-1.json"),
      path.join(input, "5-1.json"),
    );
    const result = spawnSync(
      process.execPath,
      [
        "tools/cli.mjs",
        "original",
        "patch",
        "--in",
        input,
        "--out",
        output,
      ],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    const outputNames = fs.readdirSync(output);
    assert.ok(
      outputNames.some((name) =>
        /^base-patched-\d{8}-\d{6}\.jar$/.test(name),
      ),
    );
    assert.ok(
      outputNames.some((name) =>
        /^up01-patched-\d{8}-\d{6}\.jar$/.test(name),
      ),
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});
