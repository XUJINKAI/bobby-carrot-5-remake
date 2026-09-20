import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { root } from "../../../tools/lib/fs.mjs";

test("production build 保持最终产物合同", () => {
  for (const file of [
    "dist/assets/maps/index.json",
    "dist/assets/maps/original/index.json",
    "dist/assets/maps/original/1-1.json",
    "dist/assets/maps/original/1-bonus-1.json",
    "dist/assets/maps/loma-pushbox/index.json",
    "dist/assets/maps/loma-pushbox/01-01.json",
    "dist/assets/maps/novoban-pushbox/index.json",
    "dist/assets/maps/novoban-pushbox/01.json",
    "dist/assets/adventure/index.json",
  ])
    if (!fs.existsSync(path.join(root, file)))
      throw new Error(`缺少构建产物：${file}`);
  if (fs.existsSync(path.join(root, "dist/dat")))
    throw new Error("生产产物不应包含 DAT 模块");
  for (const obsolete of ["web/dist-src", "web/dist-vite"])
    if (fs.existsSync(path.join(root, obsolete)))
      throw new Error(`Web 不应生成中间编译目录：${obsolete}`);
  assertSameTree(path.join(root, "assets"), path.join(root, "dist/assets"));
});

function assertSameTree(source, target) {
  const sourceFiles = listFiles(source);
  const targetFiles = listFiles(target);
  if (JSON.stringify(sourceFiles) !== JSON.stringify(targetFiles))
    throw new Error("dist/assets 文件列表必须与 assets 完全一致");
  for (const relative of sourceFiles)
    if (
      !fs
        .readFileSync(path.join(source, relative))
        .equals(fs.readFileSync(path.join(target, relative)))
    )
      throw new Error(`dist/assets 文件内容不一致：${relative}`);
}

function listFiles(directory, prefix = "") {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = path.join(prefix, entry.name);
      return entry.isDirectory()
        ? listFiles(path.join(directory, entry.name), relative)
        : [relative];
    })
    .sort();
}
