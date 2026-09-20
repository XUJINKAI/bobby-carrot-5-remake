import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  binCommand,
  root,
  run,
  tscCommand,
} from "../tools/lib/fs.mjs";

const TEST_CATEGORIES = new Set(["unit", "module", "entity", "integration"]);
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

const frameworkByFile = new Map(
  discovered.map((file) => [file, detectTestFramework(file)]),
);
const nodeTests = discovered.filter(
  (file) => frameworkByFile.get(file) === "node:test",
);
const vitestTests = discovered.filter(
  (file) => frameworkByFile.get(file) === "vitest",
);

if (nodeTests.length > 0) {
  run(process.execPath, ["--test", ...nodeTests.map(relativeToRoot)]);
}
if (vitestTests.length > 0) {
  run(binCommand("vitest"), [
    "run",
    "--config",
    "tests/vitest.config.ts",
    ...vitestTests,
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

function detectTestFramework(file) {
  const source = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS,
  );
  const frameworks = new Set();
  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      isRuntimeImport(statement)
    ) {
      const moduleName = statement.moduleSpecifier.text;
      if (moduleName === "node:test" || moduleName === "vitest") {
        frameworks.add(moduleName);
      }
    }
  }
  const relative = relativeToRoot(file);
  if (frameworks.size === 0) {
    throw new Error(
      `${relative}: 测试文件必须直接导入 node:test 或 vitest`,
    );
  }
  if (frameworks.size > 1) {
    throw new Error(
      `${relative}: 测试文件只能选择 node:test 或 vitest 之一`,
    );
  }
  return frameworks.values().next().value;
}

function isRuntimeImport(statement) {
  const clause = statement.importClause;
  if (!clause) return false;
  if (clause.isTypeOnly) return false;
  if (clause.name || !clause.namedBindings) return true;
  if (ts.isNamespaceImport(clause.namedBindings)) return true;
  return clause.namedBindings.elements.some((element) => !element.isTypeOnly);
}

function relativeToRoot(file) {
  return path.relative(root, file).split(path.sep).join("/");
}
