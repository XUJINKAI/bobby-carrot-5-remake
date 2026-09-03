import type { EntityCatalog } from "@bobby/engine";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import type {
  EditorDefinition,
  EditorSelection,
} from "../definitions/types.js";
import type { EditorMap, EntityRef } from "../level/types.js";
import { EditorPreview } from "./EditorPreview.js";
import type { Cell } from "./entityPlacement.js";
import { selectionRect } from "./selection.js";
import { isSurfaceEntityType } from "./surfaceAuthoring.js";

export function resolveDeletionTarget(
  level: EditorMap,
  catalog: EntityCatalog,
  cell: Cell,
  editor: EditorDefinition = builtinEditorDefinition,
): EntityRef | null {
  const candidates = deletionCandidatesAt(level, catalog, cell);
  return (
    editor.deletion?.resolveTarget({ map: level, cell, candidates }) ??
    candidates.at(-1)?.ref ??
    null
  );
}

/**
 * Palette 删除统一按视觉栈工作：
 * - 单格：只删除该格最上面的一个非 Surface Entity；
 * - 多格：删除选区内最高 stackOrder 的整层 Entity。
 * Surface 由 Surface authoring 工具负责，Palette 删除永远不触碰 Surface。
 */
export function resolveSelectionDeletionTargets(
  level: EditorMap,
  catalog: EntityCatalog,
  selection: EditorSelection,
  editor: EditorDefinition = builtinEditorDefinition,
): EntityRef[] {
  const rect = selectionRect(selection);
  if (rect.width === 1 && rect.height === 1) {
    const target = resolveDeletionTarget(
      level,
      catalog,
      { x: rect.left, y: rect.top },
      editor,
    );
    return target ? [target] : [];
  }

  const byEntity = new Map<
    number,
    { ref: EntityRef; stackOrder: number }
  >();
  for (let y = rect.top; y <= rect.bottom; y += 1) {
    for (let x = rect.left; x <= rect.right; x += 1) {
      for (const candidate of deletionCandidatesAt(level, catalog, { x, y })) {
        const previous = byEntity.get(candidate.ref.index);
        if (!previous || candidate.stackOrder > previous.stackOrder)
          byEntity.set(candidate.ref.index, {
            ref: candidate.ref,
            stackOrder: candidate.stackOrder,
          });
      }
    }
  }

  if (byEntity.size === 0) return [];
  const highest = Math.max(...[...byEntity.values()].map((item) => item.stackOrder));
  return [...byEntity.values()]
    .filter((item) => item.stackOrder === highest)
    .map((item) => item.ref);
}

function deletionCandidatesAt(
  level: EditorMap,
  catalog: EntityCatalog,
  cell: Cell,
) {
  const inspection = new EditorPreview(level, catalog).inspectCell(cell.x, cell.y);
  return inspection.presences
    .filter((item) => !isSurfaceEntityType(item.entity.type))
    .map((item) => ({
      ref: item.ref,
      entity: item.entity,
      ...(item.presence.role ? { role: item.presence.role } : {}),
      stackOrder: item.presence.stackOrder,
      traits: item.presence.traits,
    }));
}
