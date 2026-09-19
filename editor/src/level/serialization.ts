import { parseMapDocument } from "@bobby/model";
import { materializeSurfaceVariants } from "../authoring/surfacePersistence.js";
import type { EditorMap } from "./types.js";

export function serializeEditorLevel(level: EditorMap): string {
  const materialized = materializeSurfaceVariants(level);
  parseMapDocument(materialized);
  return `${JSON.stringify(materialized, null, 2)}\n`;
}

export function parseEditorLevel(text: string): EditorMap {
  const value = JSON.parse(text) as EditorMap;
  parseMapDocument(value);
  return structuredClone(value);
}
