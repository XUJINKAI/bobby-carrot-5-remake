import type { BehaviorRegistry } from "../behavior/BehaviorRegistry.js";
import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type { EntityInstance } from "../entity/EntityInstance.js";
import type { EntityPresence } from "../spatial/EntityPresence.js";

/** 通过目标 Entity Behavior 判断某个空间投影是否构成 gameplay reach。 */
export class ReachResolver {
  constructor(
    private readonly query: WorldQueryApi,
    private readonly behaviors: BehaviorRegistry,
  ) {}

  canReach(
    actor: Readonly<EntityInstance>,
    presence: Readonly<EntityPresence>,
  ): boolean {
    const entity = this.query.entity(presence.entityId);
    const definition = entity ? this.query.definition(entity.id) : undefined;
    if (!entity || !definition) return false;
    const context = {
      actor,
      self: { entity, presence },
      query: this.query,
    };
    for (const behavior of this.behaviors.resolve(
      definition.behaviors,
      presence.traits,
    )) {
      if (behavior.canReach?.(context)?.passable === false) return false;
    }
    return true;
  }

  actorReaches(
    actor: Readonly<EntityInstance>,
    selector: string,
  ): boolean {
    return this.query.presencesAt(actor.anchor).some((presence) => {
      const entity = this.query.entity(presence.entityId);
      if (!entity) return false;
      const matches =
        entity.type === selector || presence.traits.includes(selector);
      return matches && this.canReach(actor, presence);
    });
  }

  /** Definition 通过 trait 声明该 selector 是否要求所有 player 同时到达。 */
  aggregationFor(selector: string): "any" | "all" {
    const requiresAll = this.query
      .entitiesWithTrait("reach-all-players")
      .some((entity) => {
        if (entity.type === selector) return true;
        return this.query
          .presencesForEntity(entity.id)
          .some((presence) => presence.traits.includes(selector));
      });
    return requiresAll ? "all" : "any";
  }

  selectorsFor(
    actor: Readonly<EntityInstance>,
    presences: readonly EntityPresence[],
  ): string[] {
    const selectors = new Set<string>();
    for (const presence of presences) {
      if (!this.canReach(actor, presence)) continue;
      const entity = this.query.entity(presence.entityId);
      if (!entity) continue;
      selectors.add(entity.type);
      for (const trait of presence.traits) selectors.add(trait);
    }
    return [...selectors];
  }
}
