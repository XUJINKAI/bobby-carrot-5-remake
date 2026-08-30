import type { EntityCatalog } from "@bobby/engine";
import type { LevelEntity } from "@bobby/model";
import type { EditorClipboard, EditorSelection } from "../definitions/types.js";
import { normalizeEditorLevel } from "../level/editorLevel.js";
import type { EditorLevel } from "../level/types.js";
import { EditorPreview } from "./EditorPreview.js";
import type { Cell } from "./entityPlacement.js";
import { selectedEntityRefs, selectionRect } from "./selection.js";

export function copySelection(
  level: EditorLevel,
  catalog: EntityCatalog,
  selection: EditorSelection,
): EditorClipboard {
  const rect = selectionRect(selection);
  const refs = selectedEntityRefs(
    level,
    new EditorPreview(level, catalog),
    selection,
  );
  return {
    width: rect.width,
    height: rect.height,
    entities: refs.map((ref) => {
      const source = structuredClone(level.entities[ref.index]!);
      source.x -= rect.left;
      source.y -= rect.top;
      return source;
    }),
  };
}

export function pasteClipboard(
  level: EditorLevel,
  clipboard: EditorClipboard,
  origin: Cell,
): EditorLevel {
  const additions: LevelEntity[] = clipboard.entities
    .map((source) => ({
      ...structuredClone(source),
      x: origin.x + source.x,
      y: origin.y + source.y,
    }))
    .filter(
      (entity) =>
        entity.x >= 0 &&
        entity.y >= 0 &&
        entity.x < level.width &&
        entity.y < level.height,
    );
  return normalizeEditorLevel({
    ...level,
    entities: [...level.entities, ...additions],
  });
}
