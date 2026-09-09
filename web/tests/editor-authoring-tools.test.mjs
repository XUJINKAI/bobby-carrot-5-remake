import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";

const page = fs.readFileSync(
  new URL("../src/pages/editor/EditorPage.vue", import.meta.url),
  "utf8",
);
const pageState = fs.readFileSync(
  new URL("../src/pages/editor/useEditorPage.ts", import.meta.url),
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
  assert.match(inspector, /surfacePreferenceManual = ref\(false\)/);
  assert.match(
    inspector,
    /if \(!surfacePreferenceManual\.value\) showSurface\.value = panel === "surface"/,
  );
  assert.match(
    inspector,
    /surfacePreferenceManual\.value = true[\s\S]*showSurface\.value = !showSurface\.value/,
  );
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
  assert.match(surface, /editor-palette-tooltip surface-tooltip/);
  assert.doesNotMatch(surface, /surface-summary|reroll|重新分配/);
});

test("Inspector 使用与 Surface Palette 相同的 visual variant 网格", () => {
  assert.match(entityFields, /surfaceTerrainForEntity/);
  assert.match(entityFields, /surfaceVisualVariant/);
  assert.match(entityFields, /editor-surface-variant-row/);
  assert.match(entityFields, /EditorEntityPreview/);
  assert.match(entityFields, /emit\('surfaceVariant', variant\.type\)/);
  assert.match(entityFields, /if \(surfaceTerrain\.value\) keys\.add\("variant"\)/);
});
