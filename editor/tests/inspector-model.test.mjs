import assert from "node:assert/strict";
import test from "node:test";
import { MapEntityTypeId } from "@bobby/model";
import { createBuiltinEntityCatalog } from "../../engine/dist/public.js";
import {
  EditorPreview,
  buildInspectorModel,
  buildPlacementInspectorPreview,
  builtinEditorDefinition,
  createBlankLevel,
  reorderEntityStack,
} from "../dist/index.js";

const catalog = createBuiltinEntityCatalog();

test("单格 Inspector 按视觉堆叠顺序由上到下显示所有层", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push(
    {
      type: MapEntityTypeId.PORTAL,
      x: 3,
      y: 3,
      stackOrder: 1000,
      channel: "blue",
      color: "#54e8ff",
    },
    { type: MapEntityTypeId.CARROT, x: 3, y: 3, stackOrder: 2000 },
  );
  const model = buildInspectorModel(
    level,
    catalog,
    { anchor: { x: 3, y: 3 }, focus: { x: 3, y: 3 } },
    builtinEditorDefinition,
  );
  assert.equal(model.mode, "cell");
  assert.deepEqual(model.layers.slice(0, 2).map((layer) => layer.entity.type), [
    MapEntityTypeId.CARROT,
    MapEntityTypeId.PORTAL,
  ]);
});

test("Palette Brush Inspector 显示鼠标格子的放置后堆叠", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push({ type: MapEntityTypeId.CARROT, x: 3, y: 3 });
  const preview = buildPlacementInspectorPreview(
    level,
    catalog,
    { type: MapEntityTypeId.LOCK },
    { x: 3, y: 3 },
    builtinEditorDefinition,
  );
  assert.equal(preview.valid, true);
  assert.deepEqual(
    preview.after.layers.map((layer) => layer.entity.type),
    [MapEntityTypeId.LOCK, MapEntityTypeId.CARROT, MapEntityTypeId.GRASS],
  );
  assert.equal(preview.placedIndex, level.entities.length);
});

test("Palette Brush Inspector 应用 stackSlot 替换并显示堆叠警告", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push(
    { type: MapEntityTypeId.CARROT, x: 3, y: 3 },
    { type: MapEntityTypeId.LOCK, x: 3, y: 3 },
  );
  const preview = buildPlacementInspectorPreview(
    level,
    catalog,
    { type: MapEntityTypeId.EGG },
    { x: 3, y: 3 },
    builtinEditorDefinition,
  );
  assert.equal(preview.valid, true);
  assert.equal(preview.replacedCount, 1);
  assert.equal(preview.warnings[0]?.existingType, MapEntityTypeId.LOCK);
  assert.deepEqual(
    preview.after.layers.map((layer) => layer.entity.type),
    [MapEntityTypeId.EGG, MapEntityTypeId.LOCK, MapEntityTypeId.GRASS],
  );
  assert.equal(preview.placedIndex, level.entities.length - 1);
  assert.equal(
    preview.after.layers.find((layer) => layer.entity.type === MapEntityTypeId.LOCK)
      ?.ref.index,
    level.entities.length - 2,
  );
  assert.equal(
    new Set(preview.after.layers.map((layer) => layer.ref.index)).size,
    preview.after.layers.length,
  );
});

test("单格 Inspector 显示鼠标所在多格 Presence 的 role", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push({
    type: MapEntityTypeId.DRAGON,
    x: 3,
    y: 3,
    direction: "left",
  });
  const model = buildInspectorModel(
    level,
    catalog,
    { anchor: { x: 2, y: 3 }, focus: { x: 2, y: 3 } },
    builtinEditorDefinition,
  );
  assert.equal(model.layers[0]?.entity.type, MapEntityTypeId.DRAGON);
  assert.equal(model.layers[0]?.role, "head");
  assert.deepEqual(model.layers[0]?.footprint, { width: 3, height: 1 });
});

test("多格 Inspector 聚合同类素材并优先排列可编辑组", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push(
    { type: MapEntityTypeId.SPEED_SWITCH, x: 1, y: 1 },
    { type: MapEntityTypeId.SPEED_SWITCH, x: 2, y: 1 },
    { type: MapEntityTypeId.CARROT, x: 1, y: 2 },
  );
  const model = buildInspectorModel(
    level,
    catalog,
    { anchor: { x: 1, y: 1 }, focus: { x: 2, y: 2 } },
    builtinEditorDefinition,
  );
  assert.equal(model.mode, "multi");
  assert.equal(model.groups[0].type, MapEntityTypeId.SPEED_SWITCH);
  assert.equal(model.groups[0].count, 2);
  assert.equal(
    model.groups.find((group) => group.type === MapEntityTypeId.GRASS)?.count,
    4,
  );
  const firstSurface = model.groups.findIndex(
    (group) => group.type === MapEntityTypeId.GRASS,
  );
  assert.ok(firstSurface > 0);
  assert.equal(
    model.groups.slice(0, firstSurface).some(
      (group) => group.type === MapEntityTypeId.CARROT,
    ),
    true,
  );
});

test("Inspector 直接使用 canonical Entity Definition", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push(
    { type: MapEntityTypeId.EGG, x: 1, y: 1 },
    { type: MapEntityTypeId.BEANSTALK, x: 2, y: 1 },
    { type: MapEntityTypeId.WINDMILL, x: 3, y: 1, direction: "left" },
  );

  const cell = buildInspectorModel(
    level,
    catalog,
    { anchor: { x: 1, y: 1 }, focus: { x: 1, y: 1 } },
    builtinEditorDefinition,
  );
  assert.equal(cell.layers[0]?.definition.type, MapEntityTypeId.EGG);
  assert.equal(cell.layers[0]?.label, "Egg");

  const multi = buildInspectorModel(
    level,
    catalog,
    { anchor: { x: 1, y: 1 }, focus: { x: 3, y: 1 } },
    builtinEditorDefinition,
  );
  const definitions = new Map(
    multi.groups.map((group) => [group.type, group.definition.type]),
  );
  assert.equal(definitions.get(MapEntityTypeId.EGG), MapEntityTypeId.EGG);
  assert.equal(
    definitions.get(MapEntityTypeId.BEANSTALK),
    MapEntityTypeId.BEANSTALK,
  );
  assert.equal(
    definitions.get(MapEntityTypeId.WINDMILL),
    MapEntityTypeId.WINDMILL,
  );
  assert.equal(
    multi.groups.find((group) => group.type === MapEntityTypeId.EGG)?.label,
    "Egg",
  );
});

test("调整单格堆叠顺序会改变 Spatial 顶层 Presence", () => {
  const level = createBlankLevel(8, 8);
  level.entities.push(
    {
      type: MapEntityTypeId.PORTAL,
      x: 3,
      y: 3,
      channel: "blue",
      color: "#54e8ff",
    },
    { type: MapEntityTypeId.CARROT, x: 3, y: 3 },
  );
  const portalIndex = level.entities.length - 2;
  const carrotIndex = level.entities.length - 1;
  const reordered = reorderEntityStack([
    { index: portalIndex },
    { index: carrotIndex },
  ]).apply(level);
  const preview = new EditorPreview(reordered, catalog);
  assert.equal(preview.inspectCell(3, 3).top?.entity.type, MapEntityTypeId.PORTAL);
});
