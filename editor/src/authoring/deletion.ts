import type { EngineEnvironment } from "@bobby/engine";
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
  environment: EngineEnvironment,
  cell: Cell,
  editor: EditorDefinition = builtinEditorDefinition,
  preview?: EditorPreview,
): EntityRef | null {
  const candidates = deletionCandidatesAt(level, environment, cell, preview);
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
export function resolveDeletion(
  level: EditorMap,
  environment: EngineEnvironment,
  selection: EditorSelection,
  editor: EditorDefinition = builtinEditorDefinition,
): EntityRef[] {
  const rect = selectionRect(selection);
  const preview = new EditorPreview(level, environment);
  if (rect.width === 1 && rect.height === 1) {
    const target = resolveDeletionTarget(
      level,
      environment,
      { x: rect.left, y: rect.top },
      editor,
      preview,
    );
    return target ? [target] : [];
  }

  const byEntity = new Map<
    number,
    { ref: EntityRef; stackOrder: number }
  >();
  for (let y = rect.top; y <= rect.bottom; y += 1) {
    for (let x = rect.left; x <= rect.right; x += 1) {
      for (const candidate of deletionCandidatesAt(level, environment, { x, y }, preview)) {
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

/** 兼容当前 Web 调用点；统一实现由 resolveDeletion() 提供。 */
export const resolveSelectionDeletionTargets = resolveDeletion;

function deletionCandidatesAt(
  level: EditorMap,
  environment: EngineEnvironment,
  cell: Cell,
  preview = new EditorPreview(level, environment),
) {
  const inspection = preview.inspectCell(cell.x, cell.y);
  return inspection.presences
    .filter((item) => !isSurfaceEntityType(item.entity.type))
    .map((item) => ({
      ref: item.ref,
      entity: item.entity,
      ...(item.presence.role ? { role: item.presence.role } : {}),
      stackOrder: item.presence.stackOrder,
      facts: item.presence.facts,
    }));
}
