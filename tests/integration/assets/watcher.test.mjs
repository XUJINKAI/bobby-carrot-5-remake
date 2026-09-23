import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createAssetRegistry } from "../../../tools/assets/registry.mjs";
import {
  affectedAssetTasks,
  assetWatchCommandArgs,
  createAssetWatchCoordinator,
  refreshWatchedAssetGraph,
  watchedAssetInputs,
} from "../../../tools/assets/orchestrator/watcher.mjs";
import { root } from "../../../tools/lib/fs.mjs";

const { tasks } = createAssetRegistry({
  repositoryRoot: root,
  development: true,
});

test("资产 watcher 把来源变化映射到独立 Producer 分组", () => {
  assert.deepEqual(
    affectedAssetTasks("tools/assets/loma/LOMA.txt", tasks),
    ["publish.collection.loma-pushbox"],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/assets/pushbox/terrain.mjs", tasks),
    [
      "publish.collection.loma-pushbox",
      "publish.collection.novoban-pushbox",
    ],
  );
  assert.deepEqual(
    affectedAssetTasks("custom-maps/engine-lab/00-intro.json", tasks),
    ["publish.collection.engine-lab"],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/assets/robo2/overrides/mirrorL.png", tasks),
    ["publish.art.robo2"],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/assets/robo2/robo2.jar", tasks),
    ["robo2.extract"],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/assets/robo2/format.mjs", tasks),
    ["robo2.decode"],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/assets/robo2/convert.mjs", tasks),
    ["robo2.adapt"],
  );
  assert.deepEqual(
    affectedAssetTasks("web/src/app.ts", tasks),
    [],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/assets/collections.json", tasks),
    ["assets.all"],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/original/archive/extract.mjs", tasks),
    ["bc5.extract"],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/original/dat/record.mjs", tasks),
    ["bc5.decode"],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/original/adapter/adapt.mjs", tasks),
    ["bc5.adapt"],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/original/commands/inspect.mjs", tasks),
    [],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/lib/zip.mjs", tasks),
    ["bc5.extract", "robo2.extract"],
  );
});

test("资产 watcher 直接监听任务图声明的输入", () => {
  const inputs = watchedAssetInputs(tasks);
  assert.ok(inputs.includes("tools/lib/zip.mjs"));
  assert.ok(inputs.includes("model/src"));
  assert.ok(inputs.includes("custom-maps/engine-lab"));
});

test("所有 Collection Publisher 统一声明 Model 输入", () => {
  const collectionTasks = tasks.filter((task) =>
    task.id.startsWith("publish.collection."),
  );
  assert.ok(collectionTasks.length > 0);
  assert.ok(
    collectionTasks.every((task) => task.inputs.includes("model/src")),
  );
});

test("discovery 任务声明 collection visibility 输入", () => {
  const discovery = tasks.find((task) => task.id === "publish.discovery");
  assert.ok(discovery);
  assert.ok(
    discovery.inputs.includes("tools/assets/collection/visibility.mjs"),
  );
});

test("资产 watcher 使用独立 CLI 子进程执行重建与开发标记", () => {
  assert.deepEqual(assetWatchCommandArgs(["bc5.decode", "bc5.extract"]), [
    "tools/cli.mjs",
    "assets",
    "prepare",
    "--dev",
    "--replay-presence",
    "--task=bc5.decode",
    "--task=bc5.extract",
  ]);
  assert.deepEqual(assetWatchCommandArgs(["assets.all", "bc5.extract"]), [
    "tools/cli.mjs",
    "assets",
    "rebuild",
    "--dev",
    "--transactional",
    "--replay-presence",
  ]);
});

test("manifest 更新后刷新 task graph 与监听输入", (t) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "bc5r-watcher-graph-"),
  );
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const manifestFile = path.join(directory, "tools/assets/collections.json");
  fs.mkdirSync(path.dirname(manifestFile), { recursive: true });
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "tools/assets/collections.json"), "utf8"),
  );
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

  const added = [];
  const removed = [];
  const server = {
    watcher: {
      add(inputs) {
        added.push(...inputs);
      },
      unwatch(inputs) {
        removed.push(...inputs);
      },
    },
  };
  const initial = refreshWatchedAssetGraph({
    server,
    repositoryRoot: directory,
  });
  manifest.collections.push({
    id: "new-dev-collection",
    producer: "directory",
    source: "custom-maps/new-dev-collection",
    visible: "dev",
  });
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  const refreshed = refreshWatchedAssetGraph({
    server,
    repositoryRoot: directory,
    previousInputs: initial.watchedInputs,
  });

  assert.ok(
    refreshed.tasks.some(
      (task) => task.id === "publish.collection.new-dev-collection",
    ),
  );
  assert.ok(
    refreshed.watchedInputs.has("custom-maps/new-dev-collection"),
  );
  assert.ok(
    added.includes(path.join(directory, "custom-maps/new-dev-collection")),
  );
  assert.deepEqual(removed, []);
});

test("资产 watcher 合并连续事件并串行处理构建期间的新事件", async () => {
  const batches = [];
  const completions = [];
  let releaseFirst;
  const firstBuild = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const finished = deferred();
  const coordinator = createAssetWatchCoordinator({
    debounceMs: 5,
    async rebuild(taskBatch) {
      batches.push(taskBatch);
      if (batches.length === 1) {
        await firstBuild;
      }
    },
    onSuccess(taskBatch) {
      completions.push(taskBatch);
      if (completions.length === 2) {
        finished.resolve();
      }
    },
    onError: finished.reject,
  });

  coordinator.schedule(["bc5.extract"]);
  coordinator.schedule(["bc5.decode"]);
  await waitFor(() => batches.length === 1);
  coordinator.schedule(["robo2.extract"]);
  releaseFirst();
  await finished.promise;
  coordinator.close();

  assert.deepEqual(batches, [
    ["bc5.decode", "bc5.extract"],
    ["robo2.extract"],
  ]);
  assert.deepEqual(completions, batches);
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

async function waitFor(predicate) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  throw new Error("等待 watcher 测试状态超时");
}
