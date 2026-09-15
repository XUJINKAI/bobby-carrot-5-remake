import type { EngineEnvironment } from "@bobby/engine";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import type { EditorDefinition } from "../definitions/types.js";
import type { EditorMap, LevelValidationIssue } from "./types.js";

export function validateEditorLevel(
  level: EditorMap,
  environment: EngineEnvironment,
  editor: EditorDefinition = builtinEditorDefinition,
): LevelValidationIssue[] {
  const context = { map: level, environment, editor };
  return (editor.validators ?? []).flatMap((validator) => validator(context));
}
