import type { EntityId } from "../entity/EntityInstance.js";
import type { EntityRegistry } from "../entity/EntityRegistry.js";
import type { SpatialIndex } from "../spatial/SpatialIndex.js";
import type { BehaviorRegistry } from "./BehaviorRegistry.js";
import type { MechanismRegistry } from "../../mechanism/MechanismRegistry.js";
import { resolveEffectiveBehaviors } from "./EffectiveBehavior.js";

/** 从 Behavior 合同选择 tick 候选；空间索引负责实例生命周期，World 保留 hook 顺序。 */
export class TickIndex {
  private entityRevision = -1;
  private behaviorRevision = -1;
  private mechanismRevision = -1;
  private types: string[] = [];

  constructor(
    private readonly entities: EntityRegistry,
    private readonly behaviors: BehaviorRegistry,
    private readonly mechanisms: MechanismRegistry,
    private readonly spatial: SpatialIndex,
  ) {}

  entityIds(): readonly EntityId[] {
    if (
      this.entityRevision !== this.entities.revision ||
      this.behaviorRevision !== this.behaviors.revision ||
      this.mechanismRevision !== this.mechanisms.revision
    ) {
      this.types = this.entities.all().filter((definition) =>
        resolveEffectiveBehaviors(
          definition,
          this.behaviors,
          this.mechanisms,
        ).some((behavior) => behavior.onTick !== undefined),
      ).map((definition) => definition.type);
      this.entityRevision = this.entities.revision;
      this.behaviorRevision = this.behaviors.revision;
      this.mechanismRevision = this.mechanisms.revision;
    }
    const ids = new Set<EntityId>();
    for (const type of this.types)
      for (const id of this.spatial.entityIdsOfType(type)) ids.add(id);
    return [...ids].sort((a, b) => a - b);
  }
}
