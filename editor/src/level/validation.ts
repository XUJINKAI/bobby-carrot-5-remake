import type { EntityCatalog } from "@bobby/engine/authoring";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import type { EditorDefinition } from "../definitions/types.js";
import type { EditorLevel, LevelValidationIssue } from "./types.js";

export function validateEditorLevel(
  level: EditorLevel,
  catalog: EntityCatalog,
  editor: EditorDefinition = builtinEditorDefinition,
): LevelValidationIssue[] {
  const context = { map: level, catalog, editor };
  return (editor.validators ?? []).flatMap((validator) => validator(context));
}
