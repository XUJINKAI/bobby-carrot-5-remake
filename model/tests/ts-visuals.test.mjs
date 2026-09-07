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

test("已确认的复用素材与机关帧使用稳定名称", () => {
  const familyByType = new Map(
    catalog.surfaceFamilies.map((family) => [family.type, family]),
  );
  assert.deepEqual(
    new Set(familyByType.get("stone-wall").cells),
    new Set([
      "1-4", "1-5", "1-6", "2-4", "2-5", "2-6", "3-4", "3-5",
      "3-6", "1-7", "1-8", "2-7", "2-8", "3-7", "3-8", "4-7",
      "4-8", "4-9", "4-10", "10-3", "10-4",
    ]),
  );
  assert.equal(familyByType.get("snow-cloud").cells.length, 25);
  assert.deepEqual(catalog.visuals["shop-empty"], {
    cell: "10-15",
    label: "商店售罄后的空地面",
    name: "shop-empty",
  });

  const originalVisuals = new Map(
    familyByType.get("surface").cells.map((entry) => [entry.cell, entry.name]),
  );
  assert.equal(originalVisuals.get("14-10"), "dragon-tail");
  assert.equal(originalVisuals.get("14-12"), "dream-machine");
  assert.equal(originalVisuals.get("15-10"), "dragon-fire-2");
});
