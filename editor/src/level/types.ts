import type { LevelMap, LevelObject } from "@bobby/model";

export interface EditorLevel extends LevelMap {
  schemaVersion: 3;
  name: string;
  author?: string;
  description?: string;
  objects: EditorObject[];
}

export interface EditorObject extends LevelObject {}

export interface LevelValidationIssue {
  level: "error" | "warning";
  message: string;
}
