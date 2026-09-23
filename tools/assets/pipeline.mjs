import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";
import { createAssetRegistry } from "./registry.mjs";
import { commitStagedDirectoryAtomically } from "./orchestrator/atomic-output.mjs";
import { executeAssetTasks } from "./orchestrator/task-runner.mjs";

const generatedOutputs = [
  "assets/maps",
  "assets/adventure",
  "assets/art/hd",
  "assets/art/robo2",
];
const transactionSourceDirectories = [
  "custom-maps",
  "model",
  "original",
  "tools",
];

export function prepareAssets({
  includeDevCollections = false,
  force = false,
  selectedTaskIds,
  repositoryRoot = root,
} = {}) {
  const { manifest, tasks } = createAssetRegistry({
    repositoryRoot,
    development: includeDevCollections,
  });
  removeOrphanedMapOutputs(repositoryRoot, manifest);
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

function removeOrphanedMapOutputs(repositoryRoot, manifest) {
  const mapsRoot = path.join(repositoryRoot, "assets/maps");
  if (!fs.existsSync(mapsRoot)) {
    return;
  }
  const expected = new Set(manifest.collections.map((entry) => entry.id));
  for (const entry of fs.readdirSync(mapsRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && !expected.has(entry.name)) {
      fs.rmSync(path.join(mapsRoot, entry.name), {
        recursive: true,
        force: true,
      });
    }
  }
}

export function rebuildAssets(options = {}) {
  const repositoryRoot = options.repositoryRoot ?? root;
  cleanGeneratedAssets(repositoryRoot);
  return prepareAssets({ ...options, repositoryRoot, force: true });
}

export function rebuildAssetsTransactionally(options = {}) {
  const repositoryRoot = options.repositoryRoot ?? root;
  const runRebuild = options.runRebuild ?? rebuildAssets;
  const transactionParent = path.join(repositoryRoot, "tmp");
  fs.mkdirSync(transactionParent, { recursive: true });
  const transactionRoot = fs.mkdtempSync(
    path.join(transactionParent, "assets-rebuild-"),
  );

  try {
    prepareTransactionRoot(repositoryRoot, transactionRoot);
    const {
      repositoryRoot: _repositoryRoot,
      runRebuild: _runRebuild,
      ...rebuildOptions
    } = options;
    const result = runRebuild({
      ...rebuildOptions,
      repositoryRoot: transactionRoot,
    });
    commitStagedDirectoryAtomically({
      staged: path.join(transactionRoot, "assets"),
      target: path.join(repositoryRoot, "assets"),
    });
    commitStagedDirectoryAtomically({
      staged: path.join(transactionRoot, "tmp/assets"),
      target: path.join(repositoryRoot, "tmp/assets"),
    });
    return result;
  } finally {
    fs.rmSync(transactionRoot, { recursive: true, force: true });
  }
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

function prepareTransactionRoot(repositoryRoot, transactionRoot) {
  for (const relative of transactionSourceDirectories) {
    const source = path.join(repositoryRoot, relative);
    if (!fs.existsSync(source)) {
      continue;
    }
    fs.symlinkSync(
      source,
      path.join(transactionRoot, relative),
      process.platform === "win32" ? "junction" : "dir",
    );
  }
  const assets = path.join(repositoryRoot, "assets");
  if (fs.existsSync(assets)) {
    fs.cpSync(assets, path.join(transactionRoot, "assets"), {
      recursive: true,
    });
  } else {
    fs.mkdirSync(path.join(transactionRoot, "assets"), { recursive: true });
  }
}
