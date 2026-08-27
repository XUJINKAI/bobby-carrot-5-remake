import type { EntityTrait } from "../entity/EntityDefinition.js";
import type { Behavior } from "./Behavior.js";

/** Behavior 注册与 Trait 绑定表；World 不硬编码具体 EntityType。 */
export class BehaviorRegistry {
  private readonly behaviors = new Map<string, Behavior>();
  private readonly traitBindings = new Map<EntityTrait, string[]>();

  register(behavior: Behavior): void {
    if (this.behaviors.has(behavior.id)) throw new Error(`重复 Behavior：${behavior.id}`);
    this.behaviors.set(behavior.id, behavior);
  }

  registerAll(behaviors: readonly Behavior[]): void {
    for (const behavior of behaviors) this.register(behavior);
  }

  bindTrait(trait: EntityTrait, behaviorId: string): void {
    if (!this.behaviors.has(behaviorId)) throw new Error(`Trait ${trait} 绑定了未注册 Behavior：${behaviorId}`);
    const ids = this.traitBindings.get(trait) ?? [];
    if (!ids.includes(behaviorId)) ids.push(behaviorId);
    this.traitBindings.set(trait, ids);
  }

  get(id: string): Behavior | undefined {
    return this.behaviors.get(id);
  }

  require(id: string): Behavior {
    const behavior = this.get(id);
    if (!behavior) throw new Error(`未注册 Behavior：${id}`);
    return behavior;
  }

  resolve(explicit: readonly string[] = [], traits: readonly EntityTrait[] = []): readonly Behavior[] {
    const ids = new Set(explicit);
    for (const trait of traits)
      for (const id of this.traitBindings.get(trait) ?? []) ids.add(id);
    return [...ids].map((id) => this.require(id));
  }

  all(): readonly Behavior[] {
    return [...this.behaviors.values()];
  }
}
