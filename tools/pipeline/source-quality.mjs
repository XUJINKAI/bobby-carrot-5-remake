import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { root } from "../lib/fs.mjs";

const SOURCE_ROOTS = [
  "model",
  "exchange",
  "i18n",
  "engine",
  "adventure",
  "editor",
  "embed",
  "web",
  "tools",
  "tests",
];
const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".js",
  ".mjs",
  ".css",
  ".html",
  ".vue",
]);
const SCRIPT_EXTENSIONS = new Set([".ts", ".js", ".mjs"]);
const MAX_SOURCE_LINES = 1000;
const REVIEW_SOURCE_LINES = 800;
const IMAGE_MANAGER = path.normalize("engine/src/image/ImageManager.ts");
const OBSOLETE_SITE_ORIGIN = ["xujinkai", "github", "io"].join(".");
const ORIGINAL_DAT_FORBIDDEN_ROOTS = [
  "model",
  "engine",
  "adventure",
  "editor",
  "web",
];
const OBSOLETE_FACT_IDS = [
  "bean-growth-space",
  "cloud-space",
  "hidden-objective",
  "meltable",
  "reach-all-players",
  "ride-carried",
  "terrain-overlay",
];
const ENTITY_SPATIAL_ROOTS = [
  "engine/src/world/entity/",
  "engine/src/world/spatial/",
  "model/src/map/entity/",
];
const TEST_CATEGORIES = new Set([
  "unit",
  "module",
  "entity",
  "integration",
  "smoke",
  "support",
  "fixtures",
]);

const errors = [];
const warnings = [];

checkRepositoryStructure();

for (const sourceRoot of SOURCE_ROOTS) {
  walk(path.join(root, sourceRoot), (file) => {
    if (!SOURCE_EXTENSIONS.has(path.extname(file))) return;

    const text = fs.readFileSync(file, "utf8");
    const lineCount = countLines(text);
    const relative = path.relative(root, file);
    const normalized = path.normalize(relative);

    if (relative.startsWith("web/src/")) {
      const observers = text.match(/addEventListener\(\s*["']key(?:down|up)["'][^;]+/g) ?? [];
      const allowed = relative === "web/src/app/BobbyApp.ts"
        ? '"keydown", this.resumeAudio)'
        : relative === "web/src/app/keyboard/WebKeyboard.ts"
          ? '"keydown", this.observeKeyboardFocus, true)'
          : null;
      if (observers.some((observer) => !allowed || !observer.includes(allowed)))
        errors.push(`${relative}: Web 键盘命令必须注册到共享 KeyboardRuntime，仅允许音频恢复与焦点可视性 observer`);
    }

    if (lineCount > MAX_SOURCE_LINES) {
      errors.push(
        `${relative}: ${lineCount} 行，超过 ${MAX_SOURCE_LINES} 行硬限制`,
      );
    } else if (lineCount >= REVIEW_SOURCE_LINES) {
      warnings.push(`${relative}: ${lineCount} 行，建议检查是否需要按职责拆分`);
    }

    if (normalized !== IMAGE_MANAGER && /\bnew\s+Image\s*\(/.test(text)) {
      errors.push(`${relative}: 图片加载必须统一经过 ImageManager`);
    }
    if (normalized.startsWith(path.normalize("engine/src/")) && /\bstackBand\b/.test(text)) {
      errors.push(`${relative}: stackBand 已移除；空间层序只能使用 stackOrder`);
    }
    if (normalized.startsWith(path.normalize("engine/src/"))) {
      for (const id of OBSOLETE_FACT_IDS) {
        if (text.includes(`"${id}"`) || text.includes(`'${id}'`))
          errors.push(`${relative}: 已清理的 Fact ID 不得重新进入 Engine：${id}`);
      }
      if (/\bfacts\s*:\s*\[[^\]]*["']collectible["']/.test(text))
        errors.push(`${relative}: 收集对象由 Type 与 Behavior 定义，无需 collectible Fact`);
    }
    if (
      (
        ENTITY_SPATIAL_ROOTS.some((directory) =>
          normalized.startsWith(path.normalize(directory))
        ) || normalized === path.normalize("engine/src/entities/EntityModule.ts")) &&
      /\blayer\s*[?:]|\.layer\b/.test(text)
    ) {
      errors.push(`${relative}: Entity 空间合同使用 Presence、Fact 与 stackOrder`);
    }
    if (normalized.startsWith(path.normalize("engine/src/")) && /\bVisualAssetSources\b/.test(text)) {
      errors.push(`${relative}: VisualAssetSources 已移除；图片资源必须注入 ImageManager`);
    }
    if (
      normalized.startsWith(path.normalize("engine/src/")) &&
      (/\bEntityAuthoringDefinition\b/.test(text) ||
        /\bauthoring\s*:\s*\{\s*palette\s*:/.test(text))
    ) {
      errors.push(`${relative}: Entity 创建策略必须由 Editor definitions 声明`);
    }
    if (
      normalized.startsWith(path.normalize("engine/src/world/")) ||
      normalized.startsWith(path.normalize("engine/src/mechanism/"))
    ) {
      if (/from\s+["'][^"']*\/entities\//.test(text)) {
        errors.push(`${relative}: World 与通用 Mechanism 不得导入具体 Entity 模块`);
      }
      if (/\bMapEntityTypeId\b/.test(text)) {
        errors.push(`${relative}: World 与通用 Mechanism 不得按具体 Entity Type 分支`);
      }
    }
    if (
      normalized.startsWith(path.normalize("engine/src/")) &&
      /\bbindTrait\s*\(/.test(text)
    ) {
      errors.push(`${relative}: Fact 不得自动绑定 Behavior`);
    }
    if (
      normalized.startsWith(path.normalize("engine/src/world/")) &&
      /["'](?:gas|lock-key|kite|shovel|bean)["']/.test(text)
    ) {
      errors.push(`${relative}: 道具 ID 应由 Entity 规则或 Presentation 解释`);
    }
    if (normalized.startsWith(path.normalize("engine/src/world/"))) {
      const factQueries = [
        ...text.matchAll(
          /\b(?:entityHasFact|presenceHasFact|entitiesWithFact|hasFactAt|entityCountWithFact|hasEntityFact)\s*\(\s*(?:[^,()\n]+,\s*)?["']([^"']+)["']/g,
        ),
        ...text.matchAll(/\.facts\.includes\s*\(\s*["']([^"']+)["']/g),
      ];
      for (const match of factQueries) {
        if (!new Set(["player", "contact-cover"]).has(match[1])) {
          errors.push(`${relative}: World 只能直接解释 kernel Fact：${match[1]}`);
        }
      }
    }
    if (
      ORIGINAL_DAT_FORBIDDEN_ROOTS.some((directory) =>
        normalized.startsWith(path.normalize(`${directory}/src/`))
      ) &&
      /(?:@bobby\/dat|tools\/original\/dat)/.test(text)
    ) {
      errors.push(`${relative}: 产品运行时代码不得依赖 Original DAT tooling`);
    }

    if (SCRIPT_EXTENSIONS.has(path.extname(file))) {
      checkCompactCode(file, text, relative);
    }
  });
}

for (const relative of obsoleteSiteReferences()) {
  errors.push(
    `${relative}: 正式站点统一使用 https://bc5r.xujinkai.net，不应保留旧 GitHub Pages 域名`,
  );
}

for (const warning of warnings) {
  console.warn(`source-quality: warning: ${warning}`);
}

if (errors.length > 0) {
  throw new Error(`源码质量检查失败：\n- ${errors.join("\n- ")}`);
}

console.log("source-quality: OK — 源文件行数、代码排版、站点地址与 Engine 资源边界检查通过。");

function countLines(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}

function obsoleteSiteReferences() {
  const result = spawnSync(
    "git",
    ["grep", "-Il", OBSOLETE_SITE_ORIGIN, "--", "."],
    { cwd: root, encoding: "utf8" },
  );
  if (result.status === 1) return [];
  if (result.status !== 0) {
    throw new Error(`无法扫描旧站点地址：${result.stderr.trim()}`);
  }
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function checkRepositoryStructure() {
  if (fs.existsSync(path.join(root, "tools/custom"))) {
    errors.push("tools/custom/: 资产工具必须归入 tools/assets 的领域目录");
  }
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
    if (!String(command).startsWith("node tools/cli.mjs ")) {
      errors.push(`npm script 必须是 tools/cli.mjs alias：${name}`);
    }
  }

  const listed = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf8" },
  );
  if (listed.status !== 0) {
    throw new Error(`无法扫描仓库文件：${listed.stderr.trim()}`);
  }
  for (const relative of listed.stdout.split(/\r?\n/).filter(Boolean)) {
    if (
      /\.test\.(?:mjs|ts)$/.test(relative) &&
      !relative.startsWith("tests/")
    ) {
      errors.push(`${relative}: 测试文件必须位于根 tests/`);
    }
  }

  const testsRoot = path.join(root, "tests");
  for (const entry of fs.readdirSync(testsRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && !TEST_CATEGORIES.has(entry.name)) {
      errors.push(`tests/${entry.name}: tests 一级测试分类未登记`);
    }
  }

  for (const file of [
    "assets/maps/loma/01-01.json",
    "assets/maps/novoban/01.json",
    "assets/maps/robo2/01.json",
    "assets/art/robo2/mirrorL.png",
  ]) {
    const ignored = spawnSync("git", ["check-ignore", "--quiet", file], {
      cwd: root,
    });
    if (ignored.status !== 0) {
      errors.push(`${file}: 可重建生成内容必须被 Git 忽略`);
    }
  }

  checkAssetProducerImports();
}

function checkAssetProducerImports() {
  const bc5Directory = path.join(root, "tools/assets/bc5");
  const originalDirectory = path.join(root, "tools/original");
  const producerRoots = ["adapter", "archive", "catalog", "dat"].map(
    (directory) => path.join(originalDirectory, directory),
  );
  walk(bc5Directory, (file) => {
    if (!SCRIPT_EXTENSIONS.has(path.extname(file))) return;
    const text = fs.readFileSync(file, "utf8");
    const imports = [...text.matchAll(/from\s+["']([^"']+)["']/g)];
    for (const match of imports) {
      const target = path.resolve(path.dirname(file), match[1]);
      if (
        target.startsWith(`${originalDirectory}${path.sep}`) &&
        !producerRoots.some(
          (directory) =>
            target === directory || target.startsWith(`${directory}${path.sep}`),
        )
      ) {
        errors.push(
          `${path.relative(root, file)}: BC5 Producer 只能依赖 Original archive/adapter/catalog/dat 模块`,
        );
      }
    }
  });

  const rootScripts = fs
    .readdirSync(originalDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && SCRIPT_EXTENSIONS.has(path.extname(entry.name)))
    .map((entry) => entry.name);
  if (rootScripts.length !== 1 || rootScripts[0] !== "cli.mjs") {
    errors.push("tools/original/: 根目录只允许保留 cli.mjs 入口");
  }

  walk(originalDirectory, (file) => {
    if (!SCRIPT_EXTENSIONS.has(path.extname(file))) return;
    const text = fs.readFileSync(file, "utf8");
    if (/tools\/assets|\.\.\/\.\.\/assets\//.test(text)) {
      errors.push(
        `${path.relative(root, file)}: Original 模块不得依赖 tools/assets/`,
      );
    }
  });
}

function checkCompactCode(file, text, relative) {
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS,
  );

  visit(sourceFile);

  function visit(node) {
    if (ts.isBlock(node)) {
      checkBlock(node);
    }

    ts.forEachChild(node, visit);
  }

  function checkBlock(block) {
    const startLine = lineOf(block.getStart(sourceFile));
    const endLine = lineOf(block.getEnd());

    if (block.statements.length > 0 && startLine === endLine) {
      errors.push(`${relative}:${startLine}: 非空代码块不得压缩在同一行`);
      return;
    }

    for (let index = 1; index < block.statements.length; index += 1) {
      const previous = block.statements[index - 1];
      const current = block.statements[index];
      const previousEndLine = lineOf(previous.getEnd());
      const currentStartLine = lineOf(current.getStart(sourceFile));

      if (previousEndLine === currentStartLine) {
        errors.push(
          `${relative}:${currentStartLine}: 同一代码块中的多个语句不得共用一行`,
        );
      }
    }
  }

  function lineOf(position) {
    return sourceFile.getLineAndCharacterOfPosition(position).line + 1;
  }
}

function walk(directory, visitor) {
  if (!fs.existsSync(directory)) return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.name === "dist" ||
      entry.name === "node_modules"
    )
      continue;

    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, visitor);
    else visitor(file);
  }
}
