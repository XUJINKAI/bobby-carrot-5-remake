import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";
import { placementPresetWithField } from "../src/pages/editor/editorFieldValues.ts";

const page = fs.readFileSync(
  new URL("../src/pages/editor/EditorPage.vue", import.meta.url),
  "utf8",
);
const pageState = fs.readFileSync(
  new URL("../src/pages/editor/useEditorPage.ts", import.meta.url),
  "utf8",
);
const workspace = fs.readFileSync(
  new URL("../src/pages/editor/EditorWorkspace.vue", import.meta.url),
  "utf8",
);
const fieldValues = fs.readFileSync(
  new URL("../src/pages/editor/editorFieldValues.ts", import.meta.url),
  "utf8",
);
const shell = fs.readFileSync(
  new URL("../src/pages/editor/editorShell.ts", import.meta.url),
  "utf8",
);
const surface = fs.readFileSync(
  new URL("../src/pages/editor/EditorSurface.vue", import.meta.url),
  "utf8",
);
const inspector = fs.readFileSync(
  new URL("../src/pages/editor/EditorInspector.vue", import.meta.url),
  "utf8",
);
const entityFields = fs.readFileSync(
  new URL("../src/pages/editor/EditorEntityFields.vue", import.meta.url),
  "utf8",
);
const placementInspector = fs.readFileSync(
  new URL("../src/pages/editor/EditorPlacementInspector.vue", import.meta.url),
  "utf8",
);
const palette = fs.readFileSync(
  new URL("../src/pages/editor/EditorPalette.vue", import.meta.url),
  "utf8",
);
const entityPreview = fs.readFileSync(
  new URL("../src/pages/editor/EditorEntityPreview.vue", import.meta.url),
  "utf8",
);
const eraseInspector = fs.readFileSync(
  new URL("../src/pages/editor/EditorEraseInspector.vue", import.meta.url),
  "utf8",
);
const surfaceToolInspector = fs.readFileSync(
  new URL("../src/pages/editor/EditorSurfaceToolInspector.vue", import.meta.url),
  "utf8",
);
const cellInspector = fs.readFileSync(
  new URL("../src/pages/editor/EditorCellInspector.vue", import.meta.url),
  "utf8",
);
const multiInspector = fs.readFileSync(
  new URL("../src/pages/editor/EditorMultiInspector.vue", import.meta.url),
  "utf8",
);
const levelInfo = fs.readFileSync(
  new URL("../src/pages/editor/EditorLevelInfo.vue", import.meta.url),
  "utf8",
);
const materialTooltip = fs.readFileSync(
  new URL("../src/pages/editor/EditorMaterialTooltip.vue", import.meta.url),
  "utf8",
);
const tooltipState = fs.readFileSync(
  new URL("../src/pages/editor/editorMaterialTooltip.ts", import.meta.url),
  "utf8",
);
const editorStyle = fs.readFileSync(
  new URL("../../editor/style.css", import.meta.url),
  "utf8",
);

test("Palette 和 Surface 发布工具动作与简洁标题", () => {
  assert.match(shell, /id: "editor-tool-select"[\s\S]*icon: "select"[\s\S]*title: "选择"/);
  assert.match(shell, /id: "editor-tool-brush"[\s\S]*icon: "edit"[\s\S]*title: "画笔"/);
  assert.match(shell, /id: "editor-tool-erase"[\s\S]*icon: "delete"[\s\S]*title: "删除"/);
  assert.match(shell, /id: "editor-surface-select"[\s\S]*icon: "select"[\s\S]*title: "选择"/);
  assert.match(shell, /id: "editor-surface-brush"[\s\S]*icon: "edit"[\s\S]*title: "画笔"/);
  assert.match(shell, /id: "editor-surface-fill"[\s\S]*icon: "fill"[\s\S]*title: "填充"/);
  assert.match(page, /key === "3"[\s\S]*setSurfaceTool\("fill"\)/);
  assert.match(page, /key === "4"[\s\S]*setTool\("erase"\)/);
  assert.match(page, /event\.key === "Tab"[\s\S]*switchAuthoringPanel\(\)/);
});

test("Editor 默认打开 Palette 并使用 Select 语义", () => {
  assert.match(pageState, /leftPanel = ref<EditorLeftPanel>\("palette"\)/);
  assert.match(shell, /leftPanel: "palette" \| "surface" = "palette"/);
  assert.match(pageState, /paletteTool = ref<EditorTool>\("select"\)/);
  assert.match(pageState, /surfaceTool = ref<SurfaceTool>\("rect"\)/);
  assert.match(pageState, /surfaceTool\.value === "rect"[\s\S]*\? "select"/);
  assert.doesNotMatch(inspector, /\bshowSurface\b|surfacePreferenceManual/);
  assert.doesNotMatch(cellInspector, /editor-surface-toggle/);
  assert.doesNotMatch(multiInspector, /editor-surface-toggle/);
  assert.match(multiInspector, /editor-batch-divider/);
});

test("Editor Play 保持编辑器顶栏并切换为游戏底栏", () => {
  assert.match(shell, /commands: playing[\s\S]*id: "editor-play"/);
  assert.match(shell, /leading: playing[\s\S]*id: "editor-replay-record"/);
  assert.match(shell, /trailing: playing[\s\S]*id: "screen-control"/);
  assert.match(page, /bindReplayPanel/);
  assert.match(page, /action === "editor-replay-record"/);
  assert.match(workspace, /<ReplayPanel v-if="playing" :show-builtin="false" \/>/);
});

test("Editor 右键切换当前面板的选择工具并建立单格选区", () => {
  assert.match(
    pageState,
    /function selectCell\(cell: Cell\)[\s\S]*leftPanel\.value === "surface"[\s\S]*surfaceTool\.value = "rect"[\s\S]*paletteTool\.value = "select"[\s\S]*mapSelection\.value = \{ anchor: cell, focus: cell \}/,
  );
  assert.match(page, /@secondary-select="page\.selectCell"/);
  assert.doesNotMatch(page, /EditorContextMenu|contextMenu/);
});

test("新检测到的关卡规则默认启用且导入时重置检测状态", () => {
  assert.match(pageState, /ruleDetector = new EditorRuleDetector\(\)/);
  assert.match(pageState, /ruleDetector\.detect\(next\.level as EditorMap, catalog\)/);
  assert.match(pageState, /document\.execute\(enableEditorRules\(catalog, detected\)\)/);
  assert.match(pageState, /function loadLevel[\s\S]*ruleDetector\.reset\(\)[\s\S]*document\.load\(level\)/);
  assert.match(page, /page\.loadLevel\(level\)/);
});

test("Selection is non-painting and Brush fills an existing rectangular selection", () => {
  assert.match(pageState, /function fillSelectionWithBrush/);
  assert.match(pageState, /surfaceTool\.value === "rect"[\s\S]*mapSelection\.value = \{ anchor: cell, focus: cell \}/);
  assert.doesNotMatch(pageState, /surfaceRectAnchor/);
  assert.match(pageState, /paintSurface\(catalog, cells, surfaceBrush\.value\)/);
  assert.match(pageState, /for \(const target of cells\) applyPaletteBrush\(target\)/);
  assert.doesNotMatch(page, /startSurfaceSelection|fillSelectionWithBrush/);
});

test("Surface panel reuses Palette tiles and keeps theme collapsed by default", () => {
  assert.match(page, /modifier && key === "a"/);
  assert.match(page, /focus: \{ x: level\.width - 1, y: level\.height - 1 \}/);
  assert.match(surface, /<details class="surface-theme-section">/);
  assert.doesNotMatch(surface, /<details[^>]*\sopen/);
  assert.match(surface, /editor-palette-zoom/);
  assert.match(surface, /editor-palette-tile surface-terrain-tile/);
  assert.match(surface, /editor-palette-tile surface-variant/);
  assert.match(surface, /EditorMaterialTooltip/);
  assert.match(surface, /label: "Alternating"/);
  assert.match(surface, /surfaceVariantPreset\(definition\.primary\)\.type/);
  assert.doesNotMatch(surface, /variantCount|slot: definition\.slot|autoLabel/);
  assert.doesNotMatch(surface, /surface-summary|reroll|重新分配/);
});

test("素材 tooltip 共用即时显示、视口避让与键盘关联", () => {
  assert.match(palette, /supportedFields/);
  assert.match(palette, /label: "fields"/);
  assert.match(palette, /aria-describedby/);
  assert.match(surface, /Left-click to set A · Right-click to set B/);
  assert.match(surface, /label: "visual"/);
  assert.match(materialTooltip, /role="tooltip"/);
  assert.match(materialTooltip, /fitsRight/);
  assert.match(tooltipState, /delayMs = 10/);
  assert.match(tooltipState, /window\.addEventListener\("scroll", hide, true\)/);
});

test("Editor mini button 显式居中图标", () => {
  assert.match(
    editorStyle,
    /\.editor-mini-btn \{[\s\S]*display: grid;[\s\S]*place-items: center;/,
  );
});

test("Level 最大时间把单位放在标签中", () => {
  assert.match(levelInfo, /最大时间（秒）/);
  assert.doesNotMatch(levelInfo, /<small>秒<\/small>/);
});

test("Inspector 使用与 Surface Palette 相同的 visual variant 网格", () => {
  assert.match(entityFields, /surfaceTerrainForEntity/);
  assert.match(entityFields, /surfaceVisualVariant/);
  assert.match(entityFields, /editor-surface-variant-row/);
  assert.match(entityFields, /EditorEntityPreview/);
  assert.match(entityFields, /emit\('surfaceVariant', variant\.type\)/);
  assert.match(entityFields, /if \(surfaceTerrain\.value\) keys\.add\("variant"\)/);
});

test("Inspector 为颜色合同提供调色板与颜色文本输入", () => {
  assert.match(entityFields, /field\.format === "color"/);
  assert.match(entityFields, /field\.kind === "string" \|\| !controlledFieldKeys/);
  assert.match(entityFields, /normalizeColorHex/);
  assert.match(entityFields, /type="color"/);
  assert.match(entityFields, /#rgb、#rrggbb 或颜色名/);
});

test("Palette Inspector 会把 Portal 字段写回当前放置预设", () => {
  const portal = {
    type: "portal",
    fields: { channel: "blue", color: "#54e8ff" },
  };
  assert.deepEqual(placementPresetWithField(portal, "channel", "route-a"), {
    type: "portal",
    fields: { channel: "route-a", color: "#54e8ff" },
  });
  assert.deepEqual(placementPresetWithField(portal, "color", "#abc"), {
    type: "portal",
    fields: { channel: "blue", color: "#abc" },
  });
  assert.equal(placementPresetWithField(portal, "missing", "value"), null);
});

test("Inspector 按当前工具显示选择、素材、删除目标与 Surface 摘要", () => {
  assert.match(inspector, /showPlacement[\s\S]*paletteTool === "place"/);
  assert.match(inspector, /showDeletion[\s\S]*paletteTool === "erase"/);
  assert.match(inspector, /showSurfaceTool[\s\S]*surfaceTool !== "rect"/);
  assert.match(placementInspector, /EditorEntityFields/);
  assert.doesNotMatch(placementInspector, /:show-map-fields="false"/);
  assert.match(placementInspector, /@field="\(key, value\) => emit\('field', key, value\)"/);
  assert.match(placementInspector, /@variant="emit\('variant', \$event\)"/);
  assert.match(eraseInspector, /layer\.ref\.index === targetIndex/);
  assert.match(eraseInspector, /点击将删除/);
  assert.match(surfaceToolInspector, /Auto ·/);
  assert.match(surfaceToolInspector, /Alternating · A\/B/);
  assert.match(cellInspector, /layer\.footprint\.width/);
  assert.match(cellInspector, /placementPresetFromEntity/);
  assert.match(cellInspector, /drop-before/);
  assert.match(multiInspector, /placementPresetFromEntity/);
  assert.match(pageState, /resolveDeletionTarget\(currentLevel\(\), catalog, cell, editor\)/);
  assert.match(pageState, /function applyPlacementVariant/);
  assert.match(pageState, /function updatePlacementField/);
  assert.match(fieldValues, /function placementPresetWithField/);
  assert.match(page, /@placement-field="page\.updatePlacementField"/);
});

test("Palette 画笔悬浮显示正式放置规则计算的结果堆叠", () => {
  assert.match(
    pageState,
    /const hoverInspector = computed\(\(\) => \{[\s\S]*paletteTool\.value !== "erase"[\s\S]*return buildInspectorModel\(currentLevel\(\), catalog, null, editor\);[\s\S]*const cell = hover\.value/,
  );
  assert.match(pageState, /buildPlacementInspectorPreview/);
  assert.match(pageState, /placementInspectorPreview/);
  assert.match(placementInspector, /放置结果/);
  assert.match(placementInspector, /title="放置后"/);
  assert.match(placementInspector, /highlight-index="hoverPreview\.placedIndex"/);
  assert.match(placementInspector, /hoverPreview\.warnings/);
  assert.match(placementInspector, /非推荐堆叠/);
  assert.match(placementInspector, /const targets = computed/);
  assert.match(placementInspector, /:targets="targets"/);
});

test("Palette 与画笔 Inspector 把表定义的 visual state 交给缩略图", () => {
  assert.match(palette, /:preview-state="item\.preview\?\.state"/);
  assert.match(
    placementInspector,
    /:preview-state="placement\.preview\?\.state"/,
  );
  assert.match(entityPreview, /props\.previewState/);
});
