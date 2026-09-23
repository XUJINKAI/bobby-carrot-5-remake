import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";
import { createAssetRegistry } from "./registry.mjs";
import { executeAssetTasks } from "./orchestrator/task-runner.mjs";

const generatedOutputs = [
  "assets/maps",
  "assets/adventure",
  "assets/art/hd",
  "assets/art/robo2",
];

export function prepareAssets({
  includeDevCollections = false,
  force = false,
  selectedTaskIds,
  repositoryRoot = root,
} = {}) {
  const { tasks } = createAssetRegistry({
    repositoryRoot,
    development: includeDevCollections,
  });
  console.log(
    force
      ? "资产准备：请求完整重建。"
      : "资产准备：按任务缓存检查输入与输出。",
  );
  return executeAssetTasks({
    tasks,
    repositoryRoot,
    force,
    selectedTaskIds,
  });
}

export function rebuildAssets(options = {}) {
  const repositoryRoot = options.repositoryRoot ?? root;
  cleanGeneratedAssets(repositoryRoot);
  return prepareAssets({ ...options, repositoryRoot, force: true });
}

export function cleanGeneratedAssets(repositoryRoot = root) {
  fs.rmSync(path.join(repositoryRoot, "tmp/assets"), {
    recursive: true,
    force: true,
  });
  for (const relative of generatedOutputs) {
    fs.rmSync(path.join(repositoryRoot, relative), {
      recursive: true,
      force: true,
    });
  }
}
