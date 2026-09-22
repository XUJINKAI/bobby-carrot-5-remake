import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

const cacheSchemaVersion = 1;
const cacheRelativePath = "tmp/assets-prepare/state.json";
const fixedInputFiles = [
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
];
const inputDirectories = [
  { path: "model/src", extensions: new Set([".json", ".ts"]) },
  { path: "original/official-hd", extensions: new Set([".jar"]) },
  { path: "tools/original", extensions: new Set([".mjs"]) },
  { path: "tools/custom", extensions: new Set([".mjs", ".txt"]) },
  {
    path: "custom-maps",
    extensions: new Set([".json"]),
    excludedDirectories: new Set(["loma-pushbox", "novoban-pushbox"]),
  },
];
const assetGeneratedDirectories = [
  "original/extracted",
  "original/decoded",
  "original/adapted",
  "custom-maps/loma-pushbox",
  "custom-maps/novoban-pushbox",
  "assets/maps",
  "assets/adventure",
  "assets/art/hd",
];

export function inspectAssetsPrepareCache({
  includeDevCollections = false,
  repositoryRoot = root,
} = {}) {
  const snapshot = createInputSnapshot({
    includeDevCollections,
    repositoryRoot,
  });
  const state = readCacheState(repositoryRoot);
  if (!state) {
    return { hit: false, reason: "尚无缓存状态", snapshot };
  }
  if (state.includeDevCollections !== includeDevCollections) {
    return { hit: false, reason: "collection 可见模式变化", snapshot };
  }
  if (state.nodeVersion !== process.versions.node) {
    return { hit: false, reason: "Node.js 版本变化", snapshot };
  }
  if (state.inputDigest !== snapshot.digest) {
    return {
      hit: false,
      reason: describeInputDifference(state.inputs, snapshot.inputs),
      snapshot,
    };
  }
  const outputs = collectGeneratedFiles(repositoryRoot);
  if (!outputs.complete) {
    return { hit: false, reason: outputs.reason, snapshot };
  }
  const outputDifference = describeListDifference(state.outputs, outputs.files);
  if (outputDifference) {
    return { hit: false, reason: outputDifference, snapshot };
  }
  return { hit: true, snapshot };
}

export function writeAssetsPrepareCache(
  expectedSnapshot,
  {
    includeDevCollections = false,
    repositoryRoot = root,
  } = {},
) {
  const snapshot = createInputSnapshot({
    includeDevCollections,
    repositoryRoot,
  });
  if (snapshot.digest !== expectedSnapshot.digest) {
    return { written: false, reason: "生成期间输入发生变化" };
  }
  const outputs = collectGeneratedFiles(repositoryRoot);
  if (!outputs.complete) {
    throw new Error(`无法写入资产缓存：${outputs.reason}`);
  }
  const state = {
    schemaVersion: cacheSchemaVersion,
    includeDevCollections,
    nodeVersion: process.versions.node,
    inputDigest: snapshot.digest,
    inputs: snapshot.inputs,
    outputs: outputs.files,
  };
  const cacheFile = path.join(repositoryRoot, cacheRelativePath);
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  const temporaryFile = `${cacheFile}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporaryFile, `${JSON.stringify(state, null, 2)}\n`);
    fs.renameSync(temporaryFile, cacheFile);
  } finally {
    fs.rmSync(temporaryFile, { force: true });
  }
  return {
    written: true,
    inputCount: snapshot.inputs.length,
    outputCount: outputs.files.length,
  };
}

export function invalidateAssetsPrepareCache(repositoryRoot = root) {
  fs.rmSync(path.join(repositoryRoot, cacheRelativePath), { force: true });
}

function createInputSnapshot({ includeDevCollections, repositoryRoot }) {
  const files = new Set(fixedInputFiles);
  for (const definition of inputDirectories) {
    collectInputFiles(repositoryRoot, definition, files);
  }
  const inputs = [...files].sort().map((relative) => ({
    path: relative,
    sha256: hashFile(path.join(repositoryRoot, relative), relative),
  }));
  const hash = crypto.createHash("sha256");
  hash.update(`assets-prepare-cache-v${cacheSchemaVersion}\0`);
  hash.update(`dev=${includeDevCollections}\0`);
  hash.update(`node=${process.versions.node}\0`);
  for (const input of inputs) {
    hash.update(`${input.path}\0${input.sha256}\0`);
  }
  return { digest: hash.digest("hex"), inputs };
}

function collectInputFiles(repositoryRoot, definition, files) {
  const directory = path.join(repositoryRoot, definition.path);
  if (!fs.existsSync(directory)) {
    throw new Error(`资产缓存输入目录不存在：${definition.path}`);
  }
  walkFiles(directory, (file) => {
    const relativeWithinDirectory = normalizePath(path.relative(directory, file));
    const firstSegment = relativeWithinDirectory.split("/")[0];
    if (definition.excludedDirectories?.has(firstSegment)) return;
    if (!definition.extensions.has(path.extname(file))) return;
    files.add(normalizePath(path.relative(repositoryRoot, file)));
  });
}

function collectGeneratedFiles(repositoryRoot) {
  const files = [];
  for (const relativeDirectory of assetGeneratedDirectories) {
    const directory = path.join(repositoryRoot, relativeDirectory);
    if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
      return {
        complete: false,
        reason: `生成目录缺失：${relativeDirectory}`,
      };
    }
    walkFiles(directory, (file) => {
      files.push(normalizePath(path.relative(repositoryRoot, file)));
    });
  }
  return { complete: true, files: files.sort() };
}

export function clearAssetsPrepareOutputs(repositoryRoot = root) {
  for (const relativeDirectory of assetGeneratedDirectories) {
    fs.rmSync(path.join(repositoryRoot, relativeDirectory), {
      recursive: true,
      force: true,
    });
  }
}

function walkFiles(directory, visit) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkFiles(target, visit);
    } else if (entry.isFile()) {
      visit(target);
    }
  }
}

function hashFile(file, relative) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    throw new Error(`资产缓存输入文件不存在：${relative}`);
  }
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readCacheState(repositoryRoot) {
  const cacheFile = path.join(repositoryRoot, cacheRelativePath);
  if (!fs.existsSync(cacheFile)) return null;
  try {
    const state = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    if (
      state?.schemaVersion !== cacheSchemaVersion ||
      typeof state.inputDigest !== "string" ||
      !Array.isArray(state.inputs) ||
      !Array.isArray(state.outputs)
    ) {
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

function describeInputDifference(previousInputs, currentInputs) {
  const previous = new Map(
    previousInputs.map((input) => [input.path, input.sha256]),
  );
  const current = new Map(
    currentInputs.map((input) => [input.path, input.sha256]),
  );
  for (const [file, sha256] of current) {
    if (!previous.has(file)) return `新增输入：${file}`;
    if (previous.get(file) !== sha256) return `输入变化：${file}`;
  }
  for (const file of previous.keys()) {
    if (!current.has(file)) return `删除输入：${file}`;
  }
  return "输入摘要变化";
}

function describeListDifference(previousFiles, currentFiles) {
  const previous = new Set(previousFiles);
  const current = new Set(currentFiles);
  for (const file of previous) {
    if (!current.has(file)) return `生成文件缺失：${file}`;
  }
  for (const file of current) {
    if (!previous.has(file)) return `出现未登记生成文件：${file}`;
  }
  return null;
}

function normalizePath(file) {
  return file.split(path.sep).join("/");
}
