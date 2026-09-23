import path from "node:path";
import { root } from "../../lib/fs.mjs";
import { createAssetRegistry } from "../registry.mjs";
import { prepareAssets, rebuildAssets } from "../pipeline.mjs";

const watchedRoots = [
  "model/src",
  "original/official-hd",
  "tools/original",
  "tools/custom",
  "tools/assets/collections.json",
  "tools/assets/bc5",
  "tools/assets/collection",
  "tools/assets/loma",
  "tools/assets/novoban",
  "tools/assets/robo2",
  "custom-maps",
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
  const taskIds = tasks.map((task) => task.id);
  const coordinator = createAssetWatchCoordinator({
    rebuild(selectedTaskIds) {
      if (selectedTaskIds.includes("assets.all")) {
        rebuildAssets({
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
    watchedRoots.map((relative) => path.join(repositoryRoot, relative)),
  );
  const onFileEvent = (event, file) => {
    if (!new Set(["add", "change", "unlink", "addDir", "unlinkDir"]).has(event)) {
      return;
    }
    const relative = normalizePath(path.relative(repositoryRoot, file));
    const affected = affectedAssetTasks(relative, taskIds);
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

export function affectedAssetTasks(relativePath, taskIds) {
  const relative = normalizePath(relativePath);
  const existing = new Set(taskIds);
  const selected = new Set();
  const add = (...ids) => {
    for (const id of ids) {
      if (existing.has(id)) {
        selected.add(id);
      }
    }
  };
  const addCollections = (predicate = () => true) => {
    for (const id of taskIds) {
      if (id.startsWith("publish.collection.") && predicate(id)) {
        selected.add(id);
      }
    }
  };

  if (relative === "tools/assets/collections.json") {
    selected.add("assets.all");
  } else if (
    relative.startsWith("original/official-hd/") ||
    relative === "tools/original/extract.mjs" ||
    relative === "tools/original/source-definitions.mjs" ||
    relative === "tools/lib/zip.mjs" ||
    relative.startsWith("tools/assets/bc5/")
  ) {
    add("bc5.extract");
  } else if (
    relative === "tools/original/decode.mjs" ||
    relative === "tools/original/level-format.mjs" ||
    relative.startsWith("tools/original/dat/")
  ) {
    add("bc5.decode");
  } else if (relative.startsWith("tools/original/")) {
    add("bc5.adapt");
  } else if (relative.startsWith("model/src/")) {
    add("bc5.adapt", "robo2.adapt");
    addCollections((id) =>
      !id.endsWith(".original") && !id.endsWith(".robo2"),
    );
  } else if (
    relative === "tools/custom/robo2/robo2.jar" ||
    relative === "tools/custom/robo2/archive.mjs" ||
    relative === "tools/custom/robo2/format.mjs" ||
    relative.startsWith("tools/assets/robo2/")
  ) {
    add("robo2.extract");
  } else if (relative === "tools/custom/robo2/convert.mjs") {
    add("robo2.adapt");
  } else if (
    relative === "tools/custom/robo2/extract.mjs" ||
    relative.startsWith("tools/custom/robo2/overrides/")
  ) {
    add("publish.art.robo2");
  } else if (
    relative === "tools/custom/LOMA.txt" ||
    relative === "tools/custom/loma-pushbox.mjs" ||
    relative.startsWith("tools/assets/loma/")
  ) {
    add("publish.collection.loma-pushbox");
  } else if (
    relative === "tools/custom/NOVOBAN.txt" ||
    relative === "tools/custom/novoban-pushbox.mjs" ||
    relative.startsWith("tools/assets/novoban/")
  ) {
    add("publish.collection.novoban-pushbox");
  } else if (
    relative === "tools/custom/sokoban-xsb.mjs" ||
    relative === "tools/custom/pushbox-terrain.mjs" ||
    relative === "tools/custom/pushbox-terrain-table.mjs"
  ) {
    add(
      "publish.collection.loma-pushbox",
      "publish.collection.novoban-pushbox",
    );
  } else if (relative.startsWith("tools/assets/collection/")) {
    addCollections();
  } else if (relative.startsWith("custom-maps/")) {
    const collectionId = relative.split("/")[1];
    add(`publish.collection.${collectionId}`);
  }

  return [...selected].sort();
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
