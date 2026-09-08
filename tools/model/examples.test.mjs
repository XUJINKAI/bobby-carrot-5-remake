import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { parseLevelMap, parseMapDocument } from "@bobby/model";
import { root } from "../lib/fs.mjs";

const execFileAsync = promisify(execFile);

test("schema examples 生成的地图与全部 Entity 示例符合 Model 合同", async () => {
  await runSchemaExamples();

  const schemaRoot = path.join(root, "tmp/schema");
  const mapExamples = readJson(path.join(schemaRoot, "map.json"));
  parseLevelMap(mapExamples.levelMap);
  parseMapDocument(mapExamples.mapDocument);

  const entityExamples = readJson(path.join(schemaRoot, "entities.json"));
  for (const [type, entry] of Object.entries(entityExamples.entities)) {
    assert.doesNotThrow(
      () => parseLevelMap({
        schemaVersion: 1,
        width: 1,
        height: 1,
        entities: [entry.example],
      }),
      `${type} 示例应符合 Model Definition`,
    );
  }
});

test("schema examples 可以输出指定 Entity type", async () => {
  await runSchemaExamples("color-switch");
});

function runSchemaExamples(type) {
  return execFileAsync(
    process.execPath,
    ["tools/cli.mjs", "schema", "examples", ...(type ? [type] : [])],
    { cwd: root, encoding: "utf8" },
  );
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
