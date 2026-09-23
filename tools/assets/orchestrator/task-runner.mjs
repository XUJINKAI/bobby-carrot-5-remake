import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const cacheSchemaVersion = 1;

export function executeAssetTasks({
  tasks,
  repositoryRoot,
  force = false,
  selectedTaskIds,
  logger = console,
}) {
  const graph = validateTaskGraph(tasks);
  const selected = selectedTaskIds
    ? expandSelectedTasks(graph, selectedTaskIds)
    : new Set(graph.order);
  const results = new Map();

  for (const id of graph.order) {
    const task = graph.byId.get(id);
    if (!selected.has(id)) {
      const state = readTaskState(repositoryRoot, id);
      if (state) {
        results.set(id, state.resultDigest);
      }
      continue;
    }

    const dependencies = Object.fromEntries(
      task.dependencies.map((dependency) => {
        const digest = results.get(dependency);
        if (!digest) {
          throw new Error(`${id}: 依赖任务 ${dependency} 没有可用结果`);
        }
        return [dependency, digest];
      }),
    );
    const inputDigest = taskInputDigest({
      task,
      repositoryRoot,
      dependencies,
    });
    const previous = readTaskState(repositoryRoot, id);
    if (
      !force &&
      previous?.inputDigest === inputDigest &&
      outputsMatch(repositoryRoot, previous.outputs)
    ) {
      results.set(id, previous.resultDigest);
      logger.log(`资产任务缓存命中：${id}`);
      continue;
    }

    logger.log(`执行资产任务：${id}`);
    task.run();
    const outputs = collectTaskOutputs(repositoryRoot, task.outputs, id);
    const resultDigest = digestRecords(outputs);
    writeTaskState(repositoryRoot, id, {
      schemaVersion: cacheSchemaVersion,
      inputDigest,
      dependencies,
      outputs,
      resultDigest,
    });
    results.set(id, resultDigest);
  }

  return {
    executedTaskIds: graph.order.filter((id) => selected.has(id)),
    resultDigests: results,
  };
}

export function validateTaskGraph(tasks) {
  const byId = new Map();
  for (const task of tasks) {
    if (!task || typeof task.id !== "string" || !task.id) {
      throw new Error("资产任务必须提供非空 id");
    }
    if (byId.has(task.id)) {
      throw new Error(`重复资产任务：${task.id}`);
    }
    if (!Array.isArray(task.dependencies) || !Array.isArray(task.inputs)) {
      throw new Error(`${task.id}: dependencies 与 inputs 必须是数组`);
    }
    if (!Array.isArray(task.outputs) || task.outputs.length === 0) {
      throw new Error(`${task.id}: 至少需要一个独占输出`);
    }
    if (typeof task.run !== "function") {
      throw new Error(`${task.id}: 缺少 run()`);
    }
    byId.set(task.id, task);
  }

  for (const task of tasks) {
    for (const dependency of task.dependencies) {
      if (!byId.has(dependency)) {
        throw new Error(`${task.id}: 未知依赖任务 ${dependency}`);
      }
    }
  }
  assertExclusiveOutputs(tasks);
  const order = topologicalOrder(byId);
  return { byId, order };
}

function expandSelectedTasks(graph, selectedTaskIds) {
  const selected = new Set();
  const dependents = new Map(
    graph.order.map((id) => [id, []]),
  );
  for (const task of graph.byId.values()) {
    for (const dependency of task.dependencies) {
      dependents.get(dependency).push(task.id);
    }
  }

  function addDownstream(id) {
    if (!graph.byId.has(id)) {
      throw new Error(`未知资产任务：${id}`);
    }
    if (selected.has(id)) {
      return;
    }
    selected.add(id);
    for (const dependent of dependents.get(id)) {
      addDownstream(dependent);
    }
  }

  function addDependencies(id) {
    const task = graph.byId.get(id);
    for (const dependency of task.dependencies) {
      if (!selected.has(dependency)) {
        selected.add(dependency);
        addDependencies(dependency);
      }
    }
  }

  for (const id of selectedTaskIds) {
    addDownstream(id);
  }
  for (const id of [...selected]) {
    addDependencies(id);
  }
  return selected;
}

function topologicalOrder(byId) {
  const order = [];
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) {
      return;
    }
    if (visiting.has(id)) {
      throw new Error(`资产任务依赖形成环：${id}`);
    }
    visiting.add(id);
    for (const dependency of byId.get(id).dependencies) {
      visit(dependency);
    }
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  }

  for (const id of byId.keys()) {
    visit(id);
  }
  return order;
}

function assertExclusiveOutputs(tasks) {
  const owners = [];
  for (const task of tasks) {
    for (const output of task.outputs) {
      const normalized = normalizeRelative(output);
      for (const owner of owners) {
        if (
          normalized === owner.output ||
          normalized.startsWith(`${owner.output}/`) ||
          owner.output.startsWith(`${normalized}/`)
        ) {
          throw new Error(
            `${task.id} 与 ${owner.taskId} 的输出目录重叠：${normalized} / ${owner.output}`,
          );
        }
      }
      owners.push({ taskId: task.id, output: normalized });
    }
  }
}

function taskInputDigest({ task, repositoryRoot, dependencies }) {
  const records = [];
  for (const input of task.inputs) {
    records.push(...collectPathRecords(repositoryRoot, input, true));
  }
  const hash = crypto.createHash("sha256");
  hash.update(`asset-task-v${cacheSchemaVersion}\0${task.id}\0`);
  hash.update(`${task.fingerprint ?? ""}\0`);
  for (const [id, digest] of Object.entries(dependencies).sort()) {
    hash.update(`dependency\0${id}\0${digest}\0`);
  }
  for (const record of records.sort(compareRecord)) {
    hash.update(`${record.path}\0${record.sha256}\0`);
  }
  return hash.digest("hex");
}

function collectTaskOutputs(repositoryRoot, outputs, taskId) {
  const records = [];
  for (const output of outputs) {
    const outputRecords = collectPathRecords(repositoryRoot, output, false);
    if (outputRecords.length === 0) {
      throw new Error(`${taskId}: 输出不存在或为空：${output}`);
    }
    records.push(...outputRecords);
  }
  return records.sort(compareRecord);
}

function collectPathRecords(repositoryRoot, relative, requireInput) {
  const normalized = normalizeRelative(relative);
  const target = path.join(repositoryRoot, normalized);
  if (!fs.existsSync(target)) {
    if (requireInput) {
      throw new Error(`资产任务输入不存在：${normalized}`);
    }
    return [];
  }
  if (fs.statSync(target).isFile()) {
    return [{ path: normalized, sha256: hashFile(target) }];
  }

  const records = [];
  walkFiles(target, (file) => {
    records.push({
      path: normalizeRelative(path.relative(repositoryRoot, file)),
      sha256: hashFile(file),
    });
  });
  if (records.length === 0) {
    records.push({ path: `${normalized}/`, sha256: "directory" });
  }
  return records;
}

function outputsMatch(repositoryRoot, outputs) {
  if (!Array.isArray(outputs)) {
    return false;
  }
  return outputs.every((record) => {
    if (record.sha256 === "directory") {
      return fs.existsSync(path.join(repositoryRoot, record.path));
    }
    const file = path.join(repositoryRoot, record.path);
    return fs.existsSync(file) && hashFile(file) === record.sha256;
  });
}

function readTaskState(repositoryRoot, id) {
  const file = taskStateFile(repositoryRoot, id);
  if (!fs.existsSync(file)) {
    return null;
  }
  try {
    const state = JSON.parse(fs.readFileSync(file, "utf8"));
    if (
      state?.schemaVersion !== cacheSchemaVersion ||
      typeof state.inputDigest !== "string" ||
      typeof state.resultDigest !== "string"
    ) {
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

function writeTaskState(repositoryRoot, id, state) {
  const file = taskStateFile(repositoryRoot, id);
  const temporary = `${file}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`);
    fs.renameSync(temporary, file);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

function taskStateFile(repositoryRoot, id) {
  return path.join(
    repositoryRoot,
    "tmp/assets/cache",
    `${id.replaceAll("/", "-")}.json`,
  );
}

function digestRecords(records) {
  const hash = crypto.createHash("sha256");
  for (const record of records) {
    hash.update(`${record.path}\0${record.sha256}\0`);
  }
  return hash.digest("hex");
}

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
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

function normalizeRelative(value) {
  const normalized = String(value).split(path.sep).join("/");
  if (
    !normalized ||
    path.isAbsolute(normalized) ||
    normalized.split("/").includes("..")
  ) {
    throw new Error(`资产任务路径必须是仓库内相对路径：${String(value)}`);
  }
  return normalized.replace(/^\.\//, "").replace(/\/$/, "");
}

function compareRecord(left, right) {
  return left.path.localeCompare(right.path);
}
