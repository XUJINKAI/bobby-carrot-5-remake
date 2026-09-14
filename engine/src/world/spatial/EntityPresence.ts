import type { CellPosition, EntityId } from "../entity/EntityInstance.js";
import type { FactId } from "../../fact/FactRegistry.js";

/** Entity 在一个 Cell 中的空间投影；Presence 本身不是 Entity。 */
export interface EntityPresence {
  entityId: EntityId;
  cell: CellPosition;
  /** footprint part 的语义身份，例如 head/body/tail。 */
  role?: string;
  facts: readonly FactId[];
  /** 同格排序；不得用作 role 的替代。 */
  stackOrder: number;
}
