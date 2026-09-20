import fs from "node:fs";
import path from "node:path";
import {
  binCommand,
  root,
  run,
  tscCommand,
} from "../tools/lib/fs.mjs";

const TEST_CATEGORIES = new Set(["unit", "module", "entity", "integration"]);
const WEB_TEST_ROOTS = [
  path.join(root, "tests/unit/web"),
  path.join(root, "tests/module/web"),
];
const filters = process.argv.slice(2);
const selectionRoot = resolveSelectionRoot(filters);

// Original 与自定义内容生成器通过正式 Model 包入口校验输出，因此先建立最小
// bootstrap 产物，再进入内容前处理。完整 Runtime 编译位于其后。
run(tscCommand(), ["-b", "model"]);
run(process.execPath, ["tools/cli.mjs", "assets", "prepare"]);
run("npm", ["run", "build", "--workspace=@bobby/i18n"]);
run(tscCommand(), [
  "-b",
  "model",
  "exchange",
  "adventure",
  "engine",
  "editor",
  "embed",
]);

const discovered = discoverTests(selectionRoot);
if (discovered.length === 0) {
  throw new Error(`没有发现测试：${path.relative(root, selectionRoot)}`);
}

const webTests = discovered.filter(isWebTest);
const nodeTests = discovered.filter((file) => !isWebTest(file));

if (nodeTests.length > 0) {
  run(process.execPath, ["--test", ...nodeTests.map(relativeToRoot)]);
}
if (webTests.length > 0) {
  run(binCommand("vitest"), [
    "run",
    "--config",
    "tests/vitest.config.ts",
    ...webTests,
  ]);
}

function resolveSelectionRoot(parts) {
  if (parts.length === 0) return path.join(root, "tests");
  if (!TEST_CATEGORIES.has(parts[0])) {
    throw new Error(
      `测试分类必须是 ${[...TEST_CATEGORIES].join(" / ")}，实际为 ${parts[0]}`,
    );
  }
  if (parts.some((part) => !/^[a-z0-9-]+$/.test(part))) {
    throw new Error(`测试过滤参数必须是目录名：${parts.join(" ")}`);
  }
  const selected = path.resolve(root, "tests", ...parts);
  const testsRoot = `${path.resolve(root, "tests")}${path.sep}`;
  if (!selected.startsWith(testsRoot) || !fs.existsSync(selected)) {
    throw new Error(`测试目录不存在：tests/${parts.join("/")}`);
  }
  return selected;
}

function discoverTests(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      if (filters.length === 0 && entry.isDirectory() && entry.name === "smoke") {
        return [];
      }
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return discoverTests(target);
      return entry.isFile() && /\.test\.(?:mjs|ts)$/.test(entry.name)
        ? [target]
        : [];
    })
    .sort();
}

function isWebTest(file) {
  return WEB_TEST_ROOTS.some(
    (directory) => file.startsWith(`${directory}${path.sep}`),
  );
}

function relativeToRoot(file) {
  return path.relative(root, file).split(path.sep).join("/");
}
