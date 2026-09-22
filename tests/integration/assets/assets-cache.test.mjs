import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  clearAssetsPrepareOutputs,
  inspectAssetsPrepareCache,
  invalidateAssetsPrepareCache,
  writeAssetsPrepareCache,
} from "../../../tools/pipeline/assets-cache.mjs";

test("assets prepare 缓存跟踪源码输入并忽略生成内容变化", (t) => {
  const repositoryRoot = createRepositoryFixture(t);
  const initial = inspectAssetsPrepareCache({ repositoryRoot });
  assert.equal(initial.hit, false);

  const written = writeAssetsPrepareCache(initial.snapshot, { repositoryRoot });
  assert.equal(written.written, true);
  assert.equal(inspectAssetsPrepareCache({ repositoryRoot }).hit, true);

  write(repositoryRoot, "assets/maps/sample/index.json", "Replay 标记后的内容");
  assert.equal(inspectAssetsPrepareCache({ repositoryRoot }).hit, true);

  write(repositoryRoot, "custom-maps/sample/map.json", "修改后的手写地图");
  const changedInput = inspectAssetsPrepareCache({ repositoryRoot });
  assert.equal(changedInput.hit, false);
  assert.equal(
    changedInput.reason,
    "输入变化：custom-maps/sample/map.json",
  );
});

test("assets prepare 缓存在原版 JAR 内容变化时失效", (t) => {
  const repositoryRoot = createRepositoryFixture(t);
  const initial = inspectAssetsPrepareCache({ repositoryRoot });
  writeAssetsPrepareCache(initial.snapshot, { repositoryRoot });

  write(repositoryRoot, "original/official-hd/base.jar", "变化后的原版 JAR");

  const changedJar = inspectAssetsPrepareCache({ repositoryRoot });
  assert.equal(changedJar.hit, false);
  assert.equal(
    changedJar.reason,
    "输入变化：original/official-hd/base.jar",
  );
});

test("assets prepare 缓存在模式或生成文件清单变化时失效", (t) => {
  const repositoryRoot = createRepositoryFixture(t);
  const initial = inspectAssetsPrepareCache({ repositoryRoot });
  writeAssetsPrepareCache(initial.snapshot, { repositoryRoot });

  const development = inspectAssetsPrepareCache({
    includeDevCollections: true,
    repositoryRoot,
  });
  assert.equal(development.hit, false);
  assert.equal(development.reason, "collection 可见模式变化");

  fs.rmSync(path.join(repositoryRoot, "assets/adventure/index.json"));
  const missingOutput = inspectAssetsPrepareCache({ repositoryRoot });
  assert.equal(missingOutput.hit, false);
  assert.equal(
    missingOutput.reason,
    "生成文件缺失：assets/adventure/index.json",
  );

  invalidateAssetsPrepareCache(repositoryRoot);
  assert.equal(
    fs.existsSync(path.join(repositoryRoot, "tmp/assets-prepare/state.json")),
    false,
  );
});

test("assets prepare 只清理明确登记的生成目录", (t) => {
  const repositoryRoot = createRepositoryFixture(t);
  write(repositoryRoot, "assets/maps/removed-collection/index.json", "旧集合");
  write(repositoryRoot, "assets/replays/original/1-1.json", "保留 Replay");
  write(repositoryRoot, "assets/ui/icon.svg", "保留静态资源");
  write(repositoryRoot, "original/official-hd/base.jar", "保留原版 JAR");

  clearAssetsPrepareOutputs(repositoryRoot);

  assert.equal(fs.existsSync(path.join(repositoryRoot, "assets/maps")), false);
  assert.equal(
    fs.existsSync(
      path.join(repositoryRoot, "assets/replays/original/1-1.json"),
    ),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(repositoryRoot, "assets/ui/icon.svg")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(repositoryRoot, "original/official-hd/base.jar")),
    true,
  );
});

function createRepositoryFixture(t) {
  const repositoryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "bc5r-assets-cache-"),
  );
  t.after(() => fs.rmSync(repositoryRoot, { recursive: true, force: true }));

  for (const relative of [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.base.json",
    "model/package.json",
    "model/tsconfig.json",
    "tools/cli.mjs",
    "tools/lib/fs.mjs",
    "tools/lib/zip.mjs",
    "tools/pipeline/assets.mjs",
    "tools/pipeline/assets-cache.mjs",
    "custom-maps/collections.json",
    "model/src/index.ts",
    "original/official-hd/base.jar",
    "tools/original/extract.mjs",
    "tools/custom/prepare.mjs",
    "tools/custom/LOMA.txt",
    "custom-maps/sample/map.json",
  ]) {
    write(repositoryRoot, relative, `输入：${relative}`);
  }
  for (const relative of [
    "original/extracted/base/00.dat",
    "original/decoded/source-index.json",
    "original/adapted/catalog.json",
    "custom-maps/loma-pushbox/01/01-01.json",
    "custom-maps/novoban-pushbox/01.json",
    "assets/maps/sample/index.json",
    "assets/adventure/index.json",
    "assets/art/hd/ts.png",
  ]) {
    write(repositoryRoot, relative, `生成：${relative}`);
  }
  return repositoryRoot;
}

function write(repositoryRoot, relative, content) {
  const target = path.join(repositoryRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
