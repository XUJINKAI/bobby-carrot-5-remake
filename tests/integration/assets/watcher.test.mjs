import assert from "node:assert/strict";
import test from "node:test";
import { createAssetRegistry } from "../../../tools/assets/registry.mjs";
import {
  affectedAssetTasks,
  createAssetWatchCoordinator,
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
