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
  const resolvedStaged = path.resolve(staged);
  const resolvedTarget = path.resolve(target);
  if (
    resolvedStaged === resolvedTarget ||
    resolvedStaged.startsWith(`${resolvedTarget}${path.sep}`) ||
    resolvedTarget.startsWith(`${resolvedStaged}${path.sep}`)
  ) {
    throw new Error("原子提交的暂存目录与目标目录不能互相包含");
  }
  if (!fs.existsSync(resolvedStaged) || !fs.statSync(resolvedStaged).isDirectory()) {
    throw new Error(`原子提交暂存目录不存在：${resolvedStaged}`);
  }

  const backup = path.join(
    path.dirname(resolvedTarget),
    `.${path.basename(resolvedTarget)}.previous-${process.pid}`,
  );
  fs.rmSync(backup, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(resolvedTarget), { recursive: true });
  if (fs.existsSync(resolvedTarget)) {
    fs.renameSync(resolvedTarget, backup);
  }
  try {
    fs.renameSync(resolvedStaged, resolvedTarget);
  } catch (error) {
    if (fs.existsSync(backup) && !fs.existsSync(resolvedTarget)) {
      fs.renameSync(backup, resolvedTarget);
    }
    throw error;
  }
  fs.rmSync(backup, { recursive: true, force: true });
}
