import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { readZipEntry } from "../../../tools/lib/zip-patch.mjs";
import { splitDatPackage } from "../../../tools/original/dat/index.mjs";

const root = path.resolve(import.meta.dirname, "../../..");

test("目录 patch 默认使用普通版，并允许生成高清版 JAR", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "bc5r-patch-"));
  const input = path.join(temporary, "in");
  const outputRoot = path.join(root, "tmp", path.basename(temporary));
  const standardOutput = path.join(outputRoot, "standard");
  const hdOutput = path.join(outputRoot, "hd");
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
    runPatch(input, standardOutput);
    const standardBaseJar = findPatchedJar(standardOutput, "base", false);
    const standardUp01Jar = findPatchedJar(standardOutput, "up01", false);
    assertJarUsesSource(
      standardBaseJar,
      path.join(root, "original/official/base.jar"),
    );
    assertJarUsesSource(
      standardUp01Jar,
      path.join(root, "original/official/up01.jar"),
    );
    assertEncodedLevelMatchesJar(
      standardOutput,
      standardBaseJar,
      "base",
      "01-01.json",
      1,
    );
    assertEncodedLevelMatchesJar(
      standardOutput,
      standardUp01Jar,
      "up01",
      "01-01.json",
      1,
    );

    runPatch(input, hdOutput, { hd: true });
    const hdBaseJar = findPatchedJar(hdOutput, "base", true);
    const hdUp01Jar = findPatchedJar(hdOutput, "up01", true);
    assertJarUsesSource(
      hdBaseJar,
      path.join(root, "original/official-hd/base.jar"),
    );
    assertJarUsesSource(
      hdUp01Jar,
      path.join(root, "original/official-hd/up01.jar"),
    );
    assertEncodedLevelMatchesJar(
      hdOutput,
      hdBaseJar,
      "base",
      "01-01.json",
      1,
    );
    assertEncodedLevelMatchesJar(
      hdOutput,
      hdUp01Jar,
      "up01",
      "01-01.json",
      1,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

function runPatch(input, output, options = {}) {
  const args = [
    "tools/cli.mjs",
    "original",
    "patch",
    "--in",
    input,
    "--out",
    output,
  ];
  if (options.hd) args.push("--hd");
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
}

function findPatchedJar(output, release, hd) {
  const suffix = hd ? "-hd" : "";
  const pattern = new RegExp(
    `^${release}-patched-\\d{8}-\\d{6}${suffix}\\.jar$`,
  );
  const matches = fs.readdirSync(output).filter((name) => pattern.test(name));
  assert.equal(matches.length, 1, `${release} 应生成唯一 patched JAR`);
  return path.join(output, matches[0]);
}

function assertJarUsesSource(patchedJar, sourceJar) {
  const actual = readZipEntry(fs.readFileSync(patchedJar), "ts.png");
  const expected = readZipEntry(fs.readFileSync(sourceJar), "ts.png");
  assert.deepEqual(actual, expected);
}

function assertEncodedLevelMatchesJar(
  output,
  jarPath,
  release,
  name,
  levelIndex,
) {
  const encodedPath = path.join(output, "encoded", release, "levels", name);
  const encoded = JSON.parse(fs.readFileSync(encodedPath, "utf8"));
  assert.equal(encoded.schemaVersion, 1);
  assert.equal(encoded.terrainEncoding, "semantic-row-major");
  assert.equal(encoded.source.release, release);
  assert.equal(encoded.source.levelIndex, levelIndex);

  const jar = fs.readFileSync(jarPath);
  const dat = readZipEntry(jar, `${encoded.source.packFile}.dat`);
  const record = splitDatPackage(dat).levelRecords[levelIndex - 1];
  assert.equal(encoded.recordLength, record.length);
  assert.equal(
    encoded.recordSha256,
    crypto.createHash("sha256").update(record).digest("hex"),
  );
}
