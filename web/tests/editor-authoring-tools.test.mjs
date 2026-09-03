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

test("Palette and Surface expose Select and Brush while Smart Fill stays Surface-only", () => {
  assert.match(shell, /id: "editor-tool-select"/);
  assert.match(shell, /id: "editor-tool-brush"/);
  assert.doesNotMatch(shell, /id: "editor-tool-erase"/);
  assert.match(shell, /id: "editor-surface-select"/);
  assert.match(shell, /id: "editor-surface-brush"/);
  assert.match(shell, /id: "editor-surface-fill"/);
  assert.match(shell, /title: "智能填充 \(4\)"/);
});

test("Selection is non-painting and Brush fills an existing rectangular selection", () => {
  assert.match(pageState, /function fillSelectionWithBrush/);
  assert.match(pageState, /surfaceTool\.value === "rect"[\s\S]*mapSelection\.value = \{ anchor: cell, focus: cell \}/);
  assert.doesNotMatch(pageState, /surfaceRectAnchor/);
  assert.match(pageState, /paintSurface\(catalog, cells, surfaceBrush\.value\)/);
  assert.match(pageState, /for \(const target of cells\) applyPaletteBrush\(target\)/);
  assert.doesNotMatch(page, /startSurfaceSelection|fillSelectionWithBrush/);
});

test("Editor supports select-all and tightly packed Surface variant rows", () => {
  assert.match(page, /modifier && key === "a"/);
  assert.match(page, /focus: \{ x: level\.width - 1, y: level\.height - 1 \}/);
  assert.match(surface, /\.surface-variant-rows \{[\s\S]*gap: 0;/);
  assert.match(surface, /\.variant-row \+[\s\S]*border-top: 2px solid/);
  assert.match(surface, /\.variant-row \{[\s\S]*gap: 0;/);
});
