import path from "node:path";
import { root } from "../../lib/fs.mjs";
import { createAssetRegistry } from "../registry.mjs";
import {
  prepareAssets,
  rebuildAssetsTransactionally,
} from "../pipeline.mjs";

const fullRebuildInputs = [
  "tools/assets/collections.json",
  "tools/assets/collection/manifest.mjs",
  "tools/assets/collection/visibility.mjs",
];

export function attachAssetWatcher({
  server,
  repositoryRoot = root,
  afterPublish = () => {},
} = {}) {
  const { tasks } = createAssetRegistry({
    repositoryRoot,
    development: true,
  });
  const coordinator = createAssetWatchCoordinator({
    rebuild(selectedTaskIds) {
      if (selectedTaskIds.includes("assets.all")) {
        rebuildAssetsTransactionally({
          includeDevCollections: true,
          repositoryRoot,
        });
      } else {
        prepareAssets({
          includeDevCollections: true,
          repositoryRoot,
          selectedTaskIds,
        });
      }
      afterPublish();
    },
    onSuccess(selectedTaskIds) {
      console.log(
        `资产监听重建完成：${selectedTaskIds.join(", ")}`,
      );
      server.ws.send({ type: "full-reload", path: "*" });
    },
    onError(error) {
      console.error("资产监听重建失败，继续使用上一份完整输出。", error);
    },
  });

  server.watcher.add(
    watchedAssetInputs(tasks).map((relative) =>
      path.join(repositoryRoot, relative),
    ),
  );
  const onFileEvent = (event, file) => {
    if (!new Set(["add", "change", "unlink", "addDir", "unlinkDir"]).has(event)) {
      return;
    }
    const relative = normalizePath(path.relative(repositoryRoot, file));
    const affected = affectedAssetTasks(relative, tasks);
    if (affected.length > 0) {
      coordinator.schedule(affected);
    }
  };
  server.watcher.on("all", onFileEvent);

  return {
    close() {
      server.watcher.off("all", onFileEvent);
      coordinator.close();
    },
  };
}

export function watchedAssetInputs(tasks) {
  return [
    ...new Set(tasks.flatMap((task) => task.inputs.map(normalizePath))),
  ].sort();
}

export function affectedAssetTasks(relativePath, tasks) {
  const relative = normalizePath(relativePath);
  if (fullRebuildInputs.some((input) => matchesInput(relative, input))) {
    return ["assets.all"];
  }
  return tasks
    .filter((task) =>
      task.inputs.some((input) => matchesInput(relative, input)),
    )
    .map((task) => task.id)
    .sort();
}

export function createAssetWatchCoordinator({
  rebuild,
  onSuccess = () => {},
  onError = () => {},
  debounceMs = 80,
}) {
  let timer = null;
  let running = false;
  let closed = false;
  const pending = new Set();

  function schedule(taskIds) {
    if (closed) {
      return;
    }
    for (const id of taskIds) {
      pending.add(id);
    }
    if (!running) {
      clearTimeout(timer);
      timer = setTimeout(flush, debounceMs);
    }
  }

  async function flush() {
    timer = null;
    if (closed || running || pending.size === 0) {
      return;
    }
    running = true;
    const selectedTaskIds = [...pending].sort();
    pending.clear();
    try {
      await rebuild(selectedTaskIds);
      onSuccess(selectedTaskIds);
    } catch (error) {
      onError(error, selectedTaskIds);
    } finally {
      running = false;
      if (!closed && pending.size > 0) {
        timer = setTimeout(flush, debounceMs);
      }
    }
  }

  return {
    schedule,
    close() {
      closed = true;
      clearTimeout(timer);
      timer = null;
      pending.clear();
    },
  };
}

function normalizePath(file) {
  return file.split(path.sep).join("/");
}

function matchesInput(relative, input) {
  const normalized = normalizePath(input).replace(/\/$/, "");
  return relative === normalized || relative.startsWith(`${normalized}/`);
}
