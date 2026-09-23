import fs from "node:fs";
import path from "node:path";

export function publishDirectoryAtomically({ stagingRoot, target, write }) {
  const token = `${path.basename(target)}-${process.pid}-${Date.now()}`;
  const staging = path.join(stagingRoot, token);
  const backup = `${target}.previous-${process.pid}`;
  fs.rmSync(staging, { recursive: true, force: true });
  fs.rmSync(backup, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });

  try {
    write(staging);
    if (!fs.statSync(staging).isDirectory()) {
      throw new Error(`原子发布暂存目标不是目录：${staging}`);
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (fs.existsSync(target)) {
      fs.renameSync(target, backup);
    }
    try {
      fs.renameSync(staging, target);
    } catch (error) {
      if (fs.existsSync(backup) && !fs.existsSync(target)) {
        fs.renameSync(backup, target);
      }
      throw error;
    }
    fs.rmSync(backup, { recursive: true, force: true });
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

export function publishFileAtomically({ target, content }) {
  const temporary = `${target}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  try {
    fs.writeFileSync(temporary, content);
    fs.renameSync(temporary, target);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

export function commitStagedDirectoryAtomically({ staged, target }) {
  commitStagedDirectoriesAtomically([{ staged, target }]);
}

export function commitStagedDirectoriesAtomically(entries) {
  const prepared = entries.map(({ staged, target }, index) => {
    const resolvedStaged = path.resolve(staged);
    const resolvedTarget = path.resolve(target);
    assertSeparateDirectories(resolvedStaged, resolvedTarget);
    if (
      !fs.existsSync(resolvedStaged) ||
      !fs.statSync(resolvedStaged).isDirectory()
    ) {
      throw new Error(`原子提交暂存目录不存在：${resolvedStaged}`);
    }
    return {
      staged: resolvedStaged,
      target: resolvedTarget,
      hadTarget: fs.existsSync(resolvedTarget),
      backup: path.join(
        path.dirname(resolvedTarget),
        `.${path.basename(resolvedTarget)}.previous-${process.pid}-${index}`,
      ),
    };
  });
  assertExclusiveTargets(prepared);

  try {
    for (const entry of prepared) {
      fs.rmSync(entry.backup, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(entry.target), { recursive: true });
      if (fs.existsSync(entry.target)) {
        fs.renameSync(entry.target, entry.backup);
      }
    }
    for (const entry of prepared) {
      fs.renameSync(entry.staged, entry.target);
    }
  } catch (error) {
    for (const entry of prepared.toReversed()) {
      if (fs.existsSync(entry.backup)) {
        fs.rmSync(entry.target, { recursive: true, force: true });
        fs.renameSync(entry.backup, entry.target);
      } else if (!entry.hadTarget && !fs.existsSync(entry.staged)) {
        fs.rmSync(entry.target, { recursive: true, force: true });
      }
    }
    throw error;
  }
  for (const entry of prepared) {
    fs.rmSync(entry.backup, { recursive: true, force: true });
  }
}

function assertSeparateDirectories(left, right) {
  if (
    left === right ||
    left.startsWith(`${right}${path.sep}`) ||
    right.startsWith(`${left}${path.sep}`)
  ) {
    throw new Error("原子提交的暂存目录与目标目录不能互相包含");
  }
}

function assertExclusiveTargets(entries) {
  for (let index = 0; index < entries.length; index += 1) {
    for (let other = index + 1; other < entries.length; other += 1) {
      assertSeparateDirectories(entries[index].target, entries[other].target);
    }
  }
}
