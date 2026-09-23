import assert from "node:assert/strict";
import test from "node:test";
import {
  affectedAssetTasks,
  createAssetWatchCoordinator,
} from "../../../tools/assets/orchestrator/watcher.mjs";

const taskIds = [
  "bc5.extract",
  "bc5.decode",
  "bc5.adapt",
  "robo2.extract",
  "robo2.decode",
  "robo2.adapt",
  "publish.art.robo2",
  "publish.collection.original",
  "publish.collection.robo2",
  "publish.collection.loma-pushbox",
  "publish.collection.novoban-pushbox",
  "publish.collection.engine-lab",
  "publish.collection.original-patch",
  "publish.discovery",
];

test("资产 watcher 把来源变化映射到独立 Producer 分组", () => {
  assert.deepEqual(
    affectedAssetTasks("tools/custom/LOMA.txt", taskIds),
    ["publish.collection.loma-pushbox"],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/custom/pushbox-terrain.mjs", taskIds),
    [
      "publish.collection.loma-pushbox",
      "publish.collection.novoban-pushbox",
    ],
  );
  assert.deepEqual(
    affectedAssetTasks("custom-maps/engine-lab/00-intro.json", taskIds),
    ["publish.collection.engine-lab"],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/custom/robo2/overrides/mirrorL.png", taskIds),
    ["publish.art.robo2"],
  );
  assert.deepEqual(
    affectedAssetTasks("web/src/app.ts", taskIds),
    [],
  );
  assert.deepEqual(
    affectedAssetTasks("tools/assets/collections.json", taskIds),
    ["assets.all"],
  );
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
