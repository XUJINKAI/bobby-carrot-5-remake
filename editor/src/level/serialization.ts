import { serializeMapDocument } from "@bobby/model";
import { materializeSurfaceVariants } from "../authoring/surfacePersistence.js";
import type { EditorMap } from "./types.js";

export function serializeEditorLevel(level: EditorMap): string {
  const materialized = materializeSurfaceVariants(level);
  return serializeMapDocument(materialized);
}

export function parseEditorLevel(text: string): EditorMap {
  const value = JSON.parse(text) as unknown;
  return JSON.parse(serializeMapDocument(value)) as EditorMap;
}
