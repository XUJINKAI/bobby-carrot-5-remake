import { spawn } from "node:child_process";
import path from "node:path";
import { root } from "../../lib/fs.mjs";
import { createAssetRegistry } from "../registry.mjs";

const fullRebuildInputs = [
  "tools/assets/collections.json",
  "tools/assets/collection/manifest.mjs",
  "tools/assets/collection/visibility.mjs",
];

export function attachAssetWatcher({
  server,
  repositoryRoot = root,
} = {}) {
  let graph = refreshWatchedAssetGraph({ server, repositoryRoot });
  const coordinator = createAssetWatchCoordinator({
    rebuild(selectedTaskIds) {
      return runAssetWatchCommand({ selectedTaskIds, repositoryRoot });
    },
    onSuccess(selectedTaskIds) {
      if (selectedTaskIds.includes("assets.all")) {
        graph = refreshWatchedAssetGraph({
          server,
          repositoryRoot,
          previousInputs: graph.watchedInputs,
        });
      }
      console.log(
        `资产监听重建完成：${selectedTaskIds.join(", ")}`,
      );
      server.ws.send({ type: "full-reload", path: "*" });
    },
    onError(error, selectedTaskIds) {
      if (selectedTaskIds.includes("assets.all")) {
        try {
          graph = refreshWatchedAssetGraph({
            server,
            repositoryRoot,
            previousInputs: graph.watchedInputs,
          });
        } catch (refreshError) {
          console.error("资产监听任务图刷新失败。", refreshError);
        }
      }
      console.error("资产监听重建失败，继续使用上一份完整输出。", error);
    },
  });

  const onFileEvent = (event, file) => {
    if (!new Set(["add", "change", "unlink", "addDir", "unlinkDir"]).has(event)) {
      return;
    }
    const relative = normalizePath(path.relative(repositoryRoot, file));
    const affected = affectedAssetTasks(relative, graph.tasks);
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

export function refreshWatchedAssetGraph({
  server,
  repositoryRoot = root,
  previousInputs = new Set(),
}) {
  const { tasks } = createAssetRegistry({
    repositoryRoot,
    development: true,
  });
  const watchedInputs = new Set(watchedAssetInputs(tasks));
  const added = [...watchedInputs]
    .filter((input) => !previousInputs.has(input))
    .map((input) => path.join(repositoryRoot, input));
  const removed = [...previousInputs]
    .filter((input) => !watchedInputs.has(input))
    .map((input) => path.join(repositoryRoot, input));
  if (added.length > 0) {
    server.watcher.add(added);
  }
  if (removed.length > 0) {
    void server.watcher.unwatch(removed);
  }
  return { tasks, watchedInputs };
}

export function assetWatchCommandArgs(selectedTaskIds) {
  if (selectedTaskIds.includes("assets.all")) {
    return [
      "tools/cli.mjs",
      "assets",
      "rebuild",
      "--dev",
      "--transactional",
      "--replay-presence",
    ];
  }
  return [
    "tools/cli.mjs",
    "assets",
    "prepare",
    "--dev",
    "--replay-presence",
    ...selectedTaskIds.map((id) => `--task=${id}`),
  ];
}

export function runAssetWatchCommand({ selectedTaskIds, repositoryRoot }) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      assetWatchCommandArgs(selectedTaskIds),
      {
        cwd: repositoryRoot,
        stdio: "inherit",
      },
    );
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(
        `资产子进程失败：code=${String(code)} signal=${String(signal)}`,
      ));
    });
  });
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
