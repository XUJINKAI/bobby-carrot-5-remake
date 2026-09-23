import { spawnSync } from "node:child_process";
import { root, tscCommand } from "./lib/fs.mjs";

const [group, action] = process.argv.slice(2);

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (group === "original") {
  run(process.execPath, ["tools/original/cli.mjs", ...process.argv.slice(3)]);
} else if (group === "schema") {
  if (action === "examples") {
    // Storage 示例通过 Adventure 的正式 parser 生成，避免手写镜像漂移。
    run(tscCommand(), ["-b", "model", "adventure", "--force"]);
    run(process.execPath, ["tools/schema/examples.mjs", ...process.argv.slice(4)]);
  } else throw new Error("用法：node tools/cli.mjs schema examples [entity-type]");
} else if (group === "assets") {
  // 资产模块在加载时就导入 Model；冷启动必须先生成其包入口。
  run(tscCommand(), ["-b", "model"]);
  const { rebuildAssets, prepareAssets } = await import("./pipeline/assets.mjs");
  const options = {
    includeDevCollections: process.argv.includes("--dev"),
  };
  if (action === "rebuild") rebuildAssets(options);
  else if (action === "prepare") prepareAssets(options);
  else throw new Error("用法：node tools/cli.mjs assets prepare|rebuild");
} else if (group === "dev") run(process.execPath, ["tools/pipeline/dev.mjs"]);
else if (group === "build") run(process.execPath, ["tools/pipeline/build.mjs"]);
else if (group === "preview") run(process.execPath, ["tools/pipeline/preview.mjs"]);
else if (group === "test")
  run(process.execPath, ["tests/run.mjs", ...process.argv.slice(3)]);
else if (group === "verify" && action === "browser")
  run(process.execPath, ["--test", "tests/smoke/browser/browser.test.mjs"]);
else if (group === "verify") run(process.execPath, ["tools/pipeline/verify.mjs"]);
else if (group === "clean") run(process.execPath, ["tools/pipeline/clean.mjs"]);
else throw new Error("用法：node tools/cli.mjs dev|assets|build|preview|schema|test|verify|clean");
