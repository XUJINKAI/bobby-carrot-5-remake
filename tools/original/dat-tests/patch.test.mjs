import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { readZipEntry } from "../../lib/zip-patch.mjs";
import { splitDatPackage } from "../dat/index.mjs";

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
    assertEncodedLevelMatchesJar(output, "base", "01-01.json", 1);
    assertEncodedLevelMatchesJar(output, "up01", "01-01.json", 1);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

function assertEncodedLevelMatchesJar(output, release, name, levelIndex) {
  const encodedPath = path.join(output, "encoded", release, "levels", name);
  const encoded = JSON.parse(fs.readFileSync(encodedPath, "utf8"));
  assert.equal(encoded.schemaVersion, 1);
  assert.equal(encoded.terrainEncoding, "semantic-row-major");
  assert.equal(encoded.source.release, release);
  assert.equal(encoded.source.levelIndex, levelIndex);

  const jarName = fs.readdirSync(output).find((candidate) =>
    candidate.startsWith(`${release}-patched-`)
  );
  assert.ok(jarName, `${release} 应生成 patched JAR`);
  const jar = fs.readFileSync(path.join(output, jarName));
  const dat = readZipEntry(jar, `${encoded.source.packFile}.dat`);
  const record = splitDatPackage(dat).levelRecords[levelIndex - 1];
  assert.equal(encoded.recordLength, record.length);
  assert.equal(
    encoded.recordSha256,
    crypto.createHash("sha256").update(record).digest("hex"),
  );
}
