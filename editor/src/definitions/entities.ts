import type { EntityType } from "@bobby/model";
import type { EditorDefinition, EditorEntityExclusion } from "./types.js";

export function isEditorEntityCreatable(
  editor: EditorDefinition,
  type: EntityType,
): boolean {
  return !(editor.exclude ?? []).some((selector) => matchesExclusion(selector, type));
}

function matchesExclusion(
  selector: EditorEntityExclusion,
  type: EntityType,
): boolean {
  return typeof selector === "string"
    ? selector === type
    : type.startsWith(selector.prefix);
}
