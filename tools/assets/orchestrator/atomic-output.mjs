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
