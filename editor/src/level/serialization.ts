import { parseMapDocument } from "@bobby/model";
import { materializeSurfaceVariants } from "../authoring/surfacePersistence.js";
import { normalizeEditorLevel } from "./editorLevel.js";
import type { EditorMap } from "./types.js";

export function serializeEditorLevel(level: EditorMap): string {
  const materialized = materializeSurfaceVariants(level);
  const canonical = parseMapDocument(normalizeEditorLevel(materialized));
  return `${JSON.stringify(canonical, null, 2)}\n`;
}

export function parseEditorLevel(text: string): EditorMap {
  return normalizeEditorLevel(parseMapDocument(JSON.parse(text)));
}
