import type { EntityTrait } from "../entity/EntityDefinition.js";
import type { CellPosition, EntityId } from "../entity/EntityInstance.js";
import type { StackBand } from "./StackBand.js";

/** Entity 在一个 Cell 中的空间投影；Presence 本身不是 Entity。 */
export interface EntityPresence {
  entityId: EntityId;
  cell: CellPosition;
  role?: string;
  traits: readonly EntityTrait[];
  stackBand: StackBand;
  stackOrder: number;
}
