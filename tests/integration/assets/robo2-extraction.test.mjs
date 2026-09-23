import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { root } from "../../../tools/lib/fs.mjs";
import { readZipEntry } from "../../../tools/lib/zip-patch.mjs";
import { listZipEntries } from "../../../tools/lib/zip.mjs";
import {
  extractRobo2,
  robo2SourceFile,
} from "../../../tools/assets/robo2/producer.mjs";

test("Robo 2 extracted 完整保存 JAR 中的全部文件", (t) => {
  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "bc5r-robo2-extracted-"),
  );
  t.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  const extractedDirectory = path.join(temporaryRoot, "extracted");
  const jarPath = robo2SourceFile(root);
  const jar = fs.readFileSync(jarPath);

  extractRobo2({ repositoryRoot: root, outputDirectory: extractedDirectory });

  const expected = listZipEntries(jarPath)
    .filter((entry) => !entry.directory)
    .map((entry) => entry.name)
    .sort();
  const actual = listFiles(extractedDirectory);
  assert.deepEqual(actual, expected);
  assert.ok(actual.length > 25, "完整解包应包含关卡以外的程序与素材文件");

  for (const entry of expected) {
    assert.ok(
      fs.readFileSync(path.join(extractedDirectory, entry)).equals(
        readZipEntry(jar, entry),
      ),
      `${entry}: 解包内容应与 JAR entry 一致`,
    );
  }
});

function listFiles(directory, relative = "") {
  const files = [];
  for (const entry of fs.readdirSync(path.join(directory, relative), {
    withFileTypes: true,
  })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(directory, child));
    } else if (entry.isFile()) {
      files.push(child.split(path.sep).join("/"));
    }
  }
  return files.sort();
}
