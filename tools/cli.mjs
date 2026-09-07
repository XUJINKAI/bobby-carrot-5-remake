import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { root, tscCommand } from "./lib/fs.mjs";

const [group, action] = process.argv.slice(2);

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (group === "original") {
  if (action === "extract") run(process.execPath, ["tools/original/extract.mjs"]);
  else if (action === "decode") run(process.execPath, ["tools/original/decode.mjs"]);
  else if (action === "adapt") {
    run(process.execPath, ["tools/original/adapt.mjs"]);
    run(process.execPath, ["tools/original/adventure-catalog.mjs"]);
  } else if (action === "prepare") {
    run(tscCommand(), ["-b", "model", "--force"]);
    run(process.execPath, [fileURLToPath(import.meta.url), "original", "extract"]);
    run(process.execPath, [fileURLToPath(import.meta.url), "original", "decode"]);
    run(process.execPath, [fileURLToPath(import.meta.url), "original", "adapt"]);
  } else if (action === "inspect") run(process.execPath, ["tools/original/inspect.mjs", ...process.argv.slice(3)]);
  else if (action === "patch") run(process.execPath, ["tools/original/patch-cli.mjs", ...process.argv.slice(3)]);
  else if (action === "research") run(process.execPath, ["tools/original/research.mjs", ...process.argv.slice(3)]);
  else throw new Error("用法：node tools/cli.mjs original extract|decode|adapt|prepare|inspect|patch|research");
} else if (group === "schema") {
  if (action === "examples") {
    // Schema 示例只依赖 Model，保持生成命令快速且职责单一。
    run(tscCommand(), ["-b", "model", "--force"]);
    run(process.execPath, ["tools/model/examples.mjs", ...process.argv.slice(4)]);
  } else throw new Error("用法：node tools/cli.mjs schema examples [entity-type]");
} else if (group === "assets") {
  const { rebuildAssets, prepareAssets } = await import("./pipeline/assets.mjs");
  if (action === "rebuild") rebuildAssets();
  else if (action === "prepare") prepareAssets();
  else throw new Error("用法：node tools/cli.mjs assets prepare|rebuild");
} else if (group === "dev") run(process.execPath, ["tools/pipeline/dev.mjs"]);
else if (group === "build") run(process.execPath, ["tools/pipeline/build.mjs"]);
else if (group === "preview") run(process.execPath, ["tools/pipeline/dev.mjs", "web", "--static", "--no-build"]);
else if (group === "test") run(process.execPath, ["tools/pipeline/test.mjs"]);
else if (group === "verify" && action === "browser")
  run(process.execPath, ["tools/pipeline/browser-smoke.mjs"]);
else if (group === "verify") run(process.execPath, ["tools/pipeline/verify.mjs"]);
else if (group === "clean") run(process.execPath, ["tools/pipeline/clean.mjs"]);
else throw new Error("用法：node tools/cli.mjs dev|assets|build|preview|schema|test|verify|clean");
