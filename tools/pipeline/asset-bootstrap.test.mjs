import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { root } from "../lib/fs.mjs";

for (const action of ["prepare", "rebuild"]) {
  test(`assets ${action} 在 Model 产物缺失时先编译再加载资产模块`, (t) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bc5r-bootstrap-"));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    for (const relative of [
      "tools/cli.mjs",
      "tools/lib/fs.mjs",
      "tools/custom/prepare.mjs",
      "tools/custom/collection-source.mjs",
      "tools/custom/collection-visibility.mjs",
      "tsconfig.base.json",
      "model/package.json",
      "model/tsconfig.json",
      "model/src",
    ]) {
      const destination = path.join(directory, relative);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.cpSync(path.join(root, relative), destination, { recursive: true });
    }
    const scope = path.join(directory, "node_modules/@bobby");
    fs.mkdirSync(scope, { recursive: true });
    fs.symlinkSync(path.join(directory, "model"), path.join(scope, "model"), "junction");
    fs.mkdirSync(path.join(directory, "tools/pipeline"), { recursive: true });
    // 固定测试边界为 CLI bootstrap 与真实 collection parser，避免重复生成原版资产。
    fs.writeFileSync(path.join(directory, "tools/pipeline/assets.mjs"), `
import { prepareCustomCollections } from "../custom/prepare.mjs";
export const prepareAssets = prepareCustomCollections;
export const rebuildAssets = prepareCustomCollections;
`);
    const source = path.join(directory, "custom-maps/sample");
    fs.mkdirSync(source, { recursive: true });
    fs.writeFileSync(path.join(directory, "custom-maps/collections.json"), JSON.stringify({
      schemaVersion: 1,
      collections: [{ id: "sample", name: "冷启动测试" }],
    }));
    const level = {
      schemaVersion: 1,
      width: 1,
      height: 1,
      meta: { name: "冷启动测试" },
      entities: [{ type: "bobby", x: 0, y: 0 }],
    };
    fs.writeFileSync(path.join(source, "map.json"), JSON.stringify(level));
    assert.equal(fs.existsSync(path.join(directory, "model/dist")), false);
    const result = spawnSync(process.execPath, ["tools/cli.mjs", "assets", action], {
      cwd: directory,
      encoding: "utf8",
      timeout: 60_000,
      env: {
        ...process.env,
        PATH: `${path.join(root, "node_modules/.bin")}${path.delimiter}${process.env.PATH ?? ""}`,
      },
    });
    assert.equal(result.status, 0, `${result.error ?? ""}\n${result.stdout}\n${result.stderr}`);
    assert.ok(fs.existsSync(path.join(directory, "model/dist/index.js")));
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(directory, "assets/maps/sample/map.json"), "utf8")),
      level,
    );
  });
}
