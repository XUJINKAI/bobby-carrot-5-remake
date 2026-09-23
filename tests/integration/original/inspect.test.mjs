import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { inspectOriginal } from "../../../tools/original/commands/inspect.mjs";

test("Original inspect 统计保留为 original-tile 的待确认图块", () => {
  const repositoryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "bc5r-original-inspect-"),
  );
  const adaptedRoot = path.join(repositoryRoot, "tmp/assets/bc5/adapted");
  fs.mkdirSync(path.join(adaptedRoot, "maps"), { recursive: true });
  writeJson(path.join(adaptedRoot, "catalog.json"), {
    schemaVersion: 1,
    maps: [{ id: "1-1", path: "maps/1-1.json" }],
    specialScenes: [],
  });
  writeJson(path.join(adaptedRoot, "maps/1-1.json"), {
    width: 2,
    height: 1,
    entities: [
      { type: "grass", x: 0, y: 0 },
      { type: "original-tile", x: 1, y: 0, variant: "ts-14-10" },
    ],
  });

  try {
    const result = inspectOriginal({ repositoryRoot, showAll: true });
    assert.deepEqual(result, [
      {
        kind: "terrain",
        type: "original-tile",
        variant: "ts-14-10",
        dat: 217,
        datHex: "0xD9",
        count: 1,
        mapCount: 1,
        maps: [{ map: "1-1", count: 1 }],
        samples: [{ map: "1-1", x: 1, y: 0 }],
      },
    ]);
    assert.deepEqual(
      JSON.parse(
        fs.readFileSync(
          path.join(repositoryRoot, "tmp/unknown-tiles.json"),
          "utf8",
        ),
      ),
      result,
    );
  } finally {
    fs.rmSync(repositoryRoot, { recursive: true, force: true });
  }
});

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
