import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const catalog = JSON.parse(
  fs.readFileSync(
    path.join(root, "model/src/map/entity/ts-visuals.json"),
    "utf8",
  ),
);

test("ts visual 命名表完整且每个 atlas 格恰好登记一次", () => {
  const cells = [];
  for (const family of catalog.surfaceFamilies) {
    for (const source of family.cells)
      cells.push(typeof source === "string" ? source : source.cell);
  }
  for (const visual of Object.values(catalog.visuals)) cells.push(visual.cell);
  cells.push(...catalog.unidentifiedCells);

  assert.equal(cells.length, 256);
  assert.equal(new Set(cells).size, 256);
  for (let row = 1; row <= 16; row += 1) {
    for (let column = 1; column <= 16; column += 1) {
      const cell = `${row}-${column}`;
      assert.equal(
        cells.filter((candidate) => candidate === cell).length,
        1,
        `${cell} 必须恰好登记一次`,
      );
    }
  }
});

test("16-16 明确登记为全透明素材", () => {
  assert.deepEqual(catalog.visuals.transparent, {
    cell: "16-16",
    label: "全透明",
    name: "transparent",
  });
});
