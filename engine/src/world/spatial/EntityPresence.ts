import type { EntityLayer, EntityTrait } from "../entity/EntityDefinition.js";
import type { CellPosition, EntityId } from "../entity/EntityInstance.js";

/** Entity 在一个 Cell 中的空间投影；Presence 本身不是 Entity。 */
export interface EntityPresence {
  entityId: EntityId;
  cell: CellPosition;
  /** surface/object/cover 是空间语义，不由 stackOrder 推断。 */
  layer: EntityLayer;
  /** footprint part 的语义身份，例如 head/body/tail。 */
  role?: string;
  traits: readonly EntityTrait[];
  /** 同格排序；不得用作 layer 或 role 的替代。 */
  stackOrder: number;
}
