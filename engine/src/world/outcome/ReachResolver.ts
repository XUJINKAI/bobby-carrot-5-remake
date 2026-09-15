import type { BehaviorRegistry } from "../behavior/BehaviorRegistry.js";
import type { MechanismRegistry } from "../../mechanism/MechanismRegistry.js";
import { resolveEffectiveBehaviors } from "../behavior/EffectiveBehavior.js";
import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type { EntityInstance } from "../entity/EntityInstance.js";
import type { EntityRegistry } from "../entity/EntityRegistry.js";
import type { EntityPresence } from "../spatial/EntityPresence.js";
import { levelRuleSelector } from "../spatial/EntitySelector.js";
import { readonlyView } from "../behavior/ReadonlyView.js";

/** 通过目标 Entity Behavior 判断某个空间投影是否构成 gameplay reach。 */
export class ReachResolver {
  constructor(
    private readonly query: WorldQueryApi,
    private readonly entities: EntityRegistry,
    private readonly behaviors: BehaviorRegistry,
    private readonly mechanisms: MechanismRegistry,
  ) {}

  canReach(
    actor: Readonly<EntityInstance>,
    presence: Readonly<EntityPresence>,
  ): boolean {
    const entity = this.query.entity(presence.entityId);
    if (!entity) return false;
    const definition = this.entities.require(entity.type);
    const context = {
      actor: readonlyView(actor),
      self: { entity: readonlyView(entity), presence: readonlyView(presence) },
      query: this.query,
    };
    for (const behavior of resolveEffectiveBehaviors(
      definition,
      this.behaviors,
      this.mechanisms,
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
      const matches = this.query.presenceMatchesSelector(
        presence,
        levelRuleSelector(selector),
      );
      return matches && this.canReach(actor, presence);
    });
  }

}
