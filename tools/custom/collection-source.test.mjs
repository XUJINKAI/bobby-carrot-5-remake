import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { discoverCollectionSource } from "./collection-source.mjs";

test("chapter 由一级目录发现，manifest 可以省略 chapters", (t) => {
  const directory = createCollectionDirectory(t);
  writeJson(path.join(directory, "root-map.json"));
  writeJson(path.join(directory, "10", "ten.json"));
  writeJson(path.join(directory, "02", "two.json"));

  const source = discoverCollectionSource("sample", directory);

  assert.deepEqual(source.chapters, [
    { id: "02" },
    { id: "10" },
  ]);
  assert.deepEqual(
    source.files.map((file) => ({
      path: path.relative(directory, path.join(file.directory, file.filename)),
      chapter: file.chapter,
    })),
    [
      { path: "root-map.json", chapter: undefined },
      { path: "02/two.json", chapter: "02" },
      { path: "10/ten.json", chapter: "10" },
    ],
  );
});

test("manifest chapters 只补充已发现目录的展示信息", (t) => {
  const directory = createCollectionDirectory(t);
  writeJson(path.join(directory, "first", "map.json"));

  const source = discoverCollectionSource("sample", directory, {
    first: { name: "第一章", description: "章节说明" },
  });

  assert.deepEqual(source.chapters, [
    { id: "first", name: "第一章", description: "章节说明" },
  ]);
  assert.throws(
    () => discoverCollectionSource("sample", directory, { missing: { name: "悬空章节" } }),
    /chapter 补充信息没有对应目录/,
  );
});

test("chapter 目录下禁止继续嵌套目录", (t) => {
  const directory = createCollectionDirectory(t);
  fs.mkdirSync(path.join(directory, "first", "nested"), { recursive: true });

  assert.throws(
    () => discoverCollectionSource("sample", directory),
    /chapter 目录下不能再包含目录/,
  );
});

function createCollectionDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bc5r-collection-source-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function writeJson(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, "{}\n");
}
