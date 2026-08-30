import type { EntityCatalog } from "@bobby/engine";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import type { EditorDefinition } from "../definitions/types.js";
import type { EditorMap, LevelValidationIssue } from "./types.js";

export function validateEditorLevel(
  level: EditorMap,
  catalog: EntityCatalog,
  editor: EditorDefinition = builtinEditorDefinition,
): LevelValidationIssue[] {
  const context = { map: level, catalog, editor };
  return (editor.validators ?? []).flatMap((validator) => validator(context));
}
