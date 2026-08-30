import type { EntityCatalog } from "@bobby/engine";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import type { EditorDefinition } from "../definitions/types.js";
import type { EditorMap, EntityRef } from "../level/types.js";
import { EditorPreview } from "./EditorPreview.js";
import type { Cell } from "./entityPlacement.js";

export function resolveDeletionTarget(
  level: EditorMap,
  catalog: EntityCatalog,
  cell: Cell,
  editor: EditorDefinition = builtinEditorDefinition,
): EntityRef | null {
  const inspection = new EditorPreview(level, catalog).inspectCell(cell.x, cell.y);
  const candidates = inspection.presences.map((item) => ({
    ref: item.ref,
    entity: item.entity,
    ...(item.presence.role ? { role: item.presence.role } : {}),
    stackOrder: item.presence.stackOrder,
    traits: item.presence.traits,
  }));
  return (
    editor.deletion?.resolveTarget({ map: level, cell, candidates }) ??
    candidates.at(-1)?.ref ??
    null
  );
}
