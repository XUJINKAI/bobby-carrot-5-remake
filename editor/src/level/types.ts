import type { LevelEntity, LevelMap } from "@bobby/model";

export interface EditorLevel extends LevelMap {
  name: string;
  author?: string;
  description?: string;
}

/** 仅在一个 Editor snapshot 内有效，不进入持久化 JSON。 */
export interface EntityRef {
  index: number;
}

export interface InspectedEditorEntity {
  ref: EntityRef;
  entity: LevelEntity;
  role?: string;
}

export interface LevelValidationIssue {
  level: "error" | "warning";
  message: string;
}
