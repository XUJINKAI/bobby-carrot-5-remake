import type { JsonValue } from "@bobby/model";
import type { VisualId } from "../world/entity/EntityDefinition.js";
import type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "../world/entity/EntityInstance.js";
import type { EntityPresence } from "../world/spatial/EntityPresence.js";

export type QuarterTurn = 0 | 1 | 2 | 3;

export interface AtlasVisualLayer {
  kind: "atlas";
  column: number;
  row: number;
  rotate?: QuarterTurn;
  flipX?: boolean;
  flipY?: boolean;
}

export interface CustomVisualLayer {
  kind: "custom";
  id: string;
}

export type VisualLayer = AtlasVisualLayer | CustomVisualLayer;

export interface VisualComposition {
  layers: readonly VisualLayer[];
}

/** Visual resolver 只能查询 World；不能通过此接口修改 gameplay。 */
export interface VisualQuery {
  inBounds(cell: CellPosition): boolean;
  presencesAt(cell: CellPosition): readonly EntityPresence[];
  entity(id: EntityId): Readonly<EntityInstance> | undefined;
}

export interface VisualResolveContext {
  entity: Readonly<EntityInstance>;
  presence: Readonly<EntityPresence>;
  query: VisualQuery;
}

/**
 * 创建 Entity 时选择一次并写入 properties；之后只是普通持久化实例参数。
 * placement sequence 只参与确定性选择，不写进地图 JSON。
 */
export interface PersistedVisualVariantDefinition {
  property: string;
  values: readonly JsonValue[];
}

export interface VisualAuthoringDefinition {
  persistedVariant?: PersistedVisualVariantDefinition;
}

/** 一种 Entity 的表现解析逻辑。Visual 可以读取任意格的只读 World 信息。 */
export interface VisualDefinition {
  id: VisualId;
  authoring?: VisualAuthoringDefinition;
  resolve(context: VisualResolveContext): VisualComposition | null;
}
