import type { LevelEntity, MapDocument } from "@bobby/model";

/** Editor 直接编辑 canonical 持久化 MapDocument。 */
export type EditorMap = MapDocument;

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
