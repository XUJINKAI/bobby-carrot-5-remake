import { datSourceForObject, datSourceForTerrain } from "@bobby/dat";
import {
  inspectObjectDefinition,
  inspectTerrainDefinition,
  type TileDefinitionInspection,
} from "@bobby/engine";
import { resolveObjectOwner, type Cell } from "./authoring.js";
import { validateEditorLevel, type EditorLevel } from "./level.js";
import type { PaletteItem } from "./palette.js";

export function renderInspectorHtml(
  level: EditorLevel,
  hover: Cell | null,
  selection: PaletteItem,
): string {
  const issues = validateEditorLevel(level);
  const owner = hover ? resolveObjectOwner(level, hover.x, hover.y) : null;
  const selectionDefinition =
    selection.kind === "terrain"
      ? inspectTerrainDefinition(selection.type)
      : inspectObjectDefinition(selection.type);
  const source =
    selection.kind === "terrain"
      ? datSourceForTerrain(selection.type)
      : datSourceForObject(selection.type);

  return `<div class="editor-panel-title">Inspector</div><section class="editor-inspector-section"><strong>${escapeHtml(level.name)}</strong><div class="editor-muted">${level.width} × ${level.height} · ${level.objects.length} Object anchors</div><div class="editor-resize"><input type="number" min="3" max="128" value="${level.width}" data-resize-width><span>×</span><input type="number" min="3" max="128" value="${level.height}" data-resize-height><button class="editor-mini-btn" data-editor="resize">Resize</button></div></section>${definitionHtml("当前素材", selectionDefinition, source?.datHexIds)}${owner ? definitionHtml(`Owner @ ${owner.object.x},${owner.object.y} · part ${owner.partType}`, inspectObjectDefinition(owner.object.type), datSourceForObject(owner.object.type)?.datHexIds) : hover ? `<section class="editor-inspector-section"><strong>格 ${hover.x}, ${hover.y}</strong><div class="editor-muted">没有 Object owner</div></section>` : ""}<section class="editor-inspector-section"><strong>校验</strong>${issues.length ? issues.map((issue) => `<div class="editor-validation ${issue.level}">${escapeHtml(issue.message)}</div>`).join("") : '<div class="editor-muted">没有结构警告</div>'}</section>`;
}

function definitionHtml(
  title: string,
  definition: TileDefinitionInspection,
  datIds?: string[],
): string {
  return `<section class="editor-inspector-section"><strong>${escapeHtml(title)}</strong><div>${escapeHtml(definition.presentation.name)}</div><code>${escapeHtml(definition.id)}</code><div class="editor-muted">${escapeHtml(definition.presentation.category)} · DAT ${datIds?.join(", ") ?? "n/a"}</div><div class="editor-traits">${definition.traits.map((trait) => `<span>${escapeHtml(trait)}</span>`).join("")}</div>${definition.behaviors.length ? `<ul>${definition.behaviors.map((behavior) => `<li><code>${escapeHtml(behavior.id)}</code> ${escapeHtml(behavior.summary)}</li>`).join("")}</ul>` : ""}</section>`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>\"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[char] ??
      char,
  );
}
