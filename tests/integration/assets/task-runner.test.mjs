import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { publishDirectoryAtomically } from "../../../tools/assets/orchestrator/atomic-output.mjs";
import { rebuildAssetsTransactionally } from "../../../tools/assets/pipeline.mjs";
import {
  executeAssetTasks,
  validateTaskGraph,
} from "../../../tools/assets/orchestrator/task-runner.mjs";

test("资产任务按输入和依赖结果增量执行", (t) => {
  const repositoryRoot = fixture(t);
  const runs = { source: 0, publish: 0 };
  const tasks = createTasks(repositoryRoot, runs);

  executeAssetTasks({ tasks, repositoryRoot });
  assert.deepEqual(runs, { source: 1, publish: 1 });

  executeAssetTasks({ tasks, repositoryRoot });
  assert.deepEqual(runs, { source: 1, publish: 1 });

  write(repositoryRoot, "inputs/source.txt", "变化但生成结果不变");
  executeAssetTasks({ tasks, repositoryRoot });
  assert.deepEqual(runs, { source: 2, publish: 1 });

  fs.rmSync(path.join(repositoryRoot, "assets/result/value.txt"));
  executeAssetTasks({ tasks, repositoryRoot });
  assert.deepEqual(runs, { source: 2, publish: 2 });

  write(repositoryRoot, "assets/result/extra.txt", "未登记生成文件");
  executeAssetTasks({ tasks, repositoryRoot });
  assert.deepEqual(runs, { source: 2, publish: 3 });
  assert.equal(
    fs.existsSync(path.join(repositoryRoot, "assets/result/extra.txt")),
    false,
  );
});

test("资产任务拒绝重叠输出", () => {
  assert.throws(
    () => validateTaskGraph([
      taskDefinition("first", "assets/maps"),
      taskDefinition("second", "assets/maps/original"),
    ]),
    /输出目录重叠/,
  );
});

test("原子目录发布失败时保留上一份完整输出", (t) => {
  const repositoryRoot = fixture(t);
  const target = path.join(repositoryRoot, "assets/atomic");
  write(repositoryRoot, "assets/atomic/value.txt", "previous");

  assert.throws(() => {
    publishDirectoryAtomically({
      stagingRoot: path.join(repositoryRoot, "tmp/assets/publish"),
      target,
      write(directory) {
        fs.writeFileSync(path.join(directory, "value.txt"), "next");
        throw new Error("模拟生成失败");
      },
    });
  }, /模拟生成失败/);

  assert.equal(
    fs.readFileSync(path.join(target, "value.txt"), "utf8"),
    "previous",
  );
});

test("完整资产重建失败时继续使用上一份 assets", async (t) => {
  const repositoryRoot = fixture(t);
  write(repositoryRoot, "assets/maps/value.txt", "previous");
  write(repositoryRoot, "assets/ui/value.txt", "stable");

  await assert.rejects(
    rebuildAssetsTransactionally({
      repositoryRoot,
      runRebuild({ repositoryRoot: transactionRoot }) {
        replaceDirectory(
          path.join(transactionRoot, "assets/maps"),
          "incomplete",
        );
        throw new Error("模拟完整重建失败");
      },
    }),
    /模拟完整重建失败/,
  );

  assert.equal(
    fs.readFileSync(path.join(repositoryRoot, "assets/maps/value.txt"), "utf8"),
    "previous",
  );
  assert.equal(
    fs.readFileSync(path.join(repositoryRoot, "assets/ui/value.txt"), "utf8"),
    "stable",
  );
});

test("完整资产重建只提交生成目录与任务缓存", async (t) => {
  const repositoryRoot = fixture(t);
  write(repositoryRoot, "assets/maps/value.txt", "previous");
  write(repositoryRoot, "assets/ui/value.txt", "stable");
  write(repositoryRoot, "assets/audio/value.txt", "stable-audio");
  write(repositoryRoot, "assets/replays/value.json", "before-rebuild");
  write(repositoryRoot, "tmp/assets/cache/value.txt", "previous-cache");

  const result = await rebuildAssetsTransactionally({
    repositoryRoot,
    runRebuild({ repositoryRoot: transactionRoot }) {
      writeGeneratedOutputs(transactionRoot, "next");
      replaceDirectory(
        path.join(transactionRoot, "tmp/assets/cache"),
        "next-cache",
      );
      write(
        repositoryRoot,
        "assets/replays/value.json",
        "saved-during-rebuild",
      );
      return "rebuilt";
    },
  });

  assert.equal(result, "rebuilt");
  assert.equal(
    fs.readFileSync(path.join(repositoryRoot, "assets/maps/value.txt"), "utf8"),
    "next",
  );
  assert.equal(
    fs.readFileSync(path.join(repositoryRoot, "assets/ui/value.txt"), "utf8"),
    "stable",
  );
  assert.equal(
    fs.readFileSync(path.join(repositoryRoot, "assets/audio/value.txt"), "utf8"),
    "stable-audio",
  );
  assert.equal(
    fs.readFileSync(
      path.join(repositoryRoot, "assets/replays/value.json"),
      "utf8",
    ),
    "saved-during-rebuild",
  );
  assert.equal(
    fs.readFileSync(
      path.join(repositoryRoot, "tmp/assets/cache/value.txt"),
      "utf8",
    ),
    "next-cache",
  );
});

test("完整资产重建的提交前检查失败时保留上一份输出", async (t) => {
  const repositoryRoot = fixture(t);
  write(repositoryRoot, "assets/maps/value.txt", "previous");
  write(repositoryRoot, "tmp/assets/cache/value.txt", "previous-cache");

  await assert.rejects(
    rebuildAssetsTransactionally({
      repositoryRoot,
      runRebuild({ repositoryRoot: transactionRoot }) {
        replaceDirectory(path.join(transactionRoot, "assets/maps"), "next");
        replaceDirectory(
          path.join(transactionRoot, "tmp/assets/cache"),
          "next-cache",
        );
      },
      beforeCommit() {
        throw new Error("模拟 Replay 验真失败");
      },
    }),
    /模拟 Replay 验真失败/,
  );

  assert.equal(
    fs.readFileSync(path.join(repositoryRoot, "assets/maps/value.txt"), "utf8"),
    "previous",
  );
  assert.equal(
    fs.readFileSync(
      path.join(repositoryRoot, "tmp/assets/cache/value.txt"),
      "utf8",
    ),
    "previous-cache",
  );
});

function createTasks(repositoryRoot, runs) {
  return [
    {
      id: "source",
      dependencies: [],
      inputs: ["inputs/source.txt"],
      outputs: ["tmp/generated/source"],
      run() {
        runs.source += 1;
        replaceDirectory(
          path.join(repositoryRoot, "tmp/generated/source"),
          "stable",
        );
      },
    },
    {
      id: "publish",
      dependencies: ["source"],
      inputs: ["inputs/publisher.txt"],
      outputs: ["assets/result"],
      run() {
        runs.publish += 1;
        replaceDirectory(
          path.join(repositoryRoot, "assets/result"),
          "published",
        );
      },
    },
  ];
}

function taskDefinition(id, output) {
  return {
    id,
    dependencies: [],
    inputs: [],
    outputs: [output],
    run() {},
  };
}

function replaceDirectory(directory, content) {
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "value.txt"), content);
}

function writeGeneratedOutputs(repositoryRoot, content) {
  for (const relative of [
    "assets/maps",
    "assets/adventure",
    "assets/art/hd",
    "assets/art/robo2",
  ]) {
    replaceDirectory(path.join(repositoryRoot, relative), content);
  }
}

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bc5r-task-graph-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  write(directory, "inputs/source.txt", "source");
  write(directory, "inputs/publisher.txt", "publisher");
  return directory;
}

function write(repositoryRoot, relative, content) {
  const target = path.join(repositoryRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
