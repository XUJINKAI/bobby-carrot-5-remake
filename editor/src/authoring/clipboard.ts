import type { EngineEnvironment } from "@bobby/engine";
import type { LevelEntity } from "@bobby/model";
import type { EditorClipboard, EditorSelection } from "../definitions/types.js";
import { normalizeEditorLevel } from "../level/editorLevel.js";
import type { EditorMap, EntityRef } from "../level/types.js";
import { editorPreviewFor } from "./EditorPreview.js";
import type { Cell } from "./entityPlacement.js";
import { selectedEntityRefs, selectionRect } from "./selection.js";
import { isSurfaceEntityType } from "./surfaceAuthoring.js";

export function copySelection(
  level: EditorMap,
  environment: EngineEnvironment,
  selection: EditorSelection,
): EditorClipboard {
  return copyRefs(
    level,
    selection,
    selectedEntityRefs(level, editorPreviewFor(level, environment), selection),
  );
}

export function copyEntitySelection(
  level: EditorMap,
  environment: EngineEnvironment,
  selection: EditorSelection,
): EditorClipboard {
  const refs = selectedEntityRefs(
    level,
    editorPreviewFor(level, environment),
    selection,
  ).filter((ref) => {
    const entity = level.entities[ref.index];
    return entity && !isSurfaceEntityType(entity.type);
  });
  return copyRefs(level, selection, refs);
}

export function pasteClipboard(
  level: EditorMap,
  clipboard: EditorClipboard,
  origin: Cell,
): EditorMap {
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

function copyRefs(
  level: EditorMap,
  selection: EditorSelection,
  refs: readonly EntityRef[],
): EditorClipboard {
  const rect = selectionRect(selection);
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
