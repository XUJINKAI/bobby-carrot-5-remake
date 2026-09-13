import type { Behavior } from "./Behavior.js";

/** Behavior ID 查找；是否调用由 Entity 的显式组合决定。 */
export class BehaviorRegistry {
  private readonly behaviors = new Map<string, Behavior>();
  private version = 0;

  get revision(): number {
    return this.version;
  }

  register(behavior: Behavior): void {
    if (this.behaviors.has(behavior.id)) throw new Error(`重复 Behavior：${behavior.id}`);
    this.behaviors.set(behavior.id, behavior);
    this.version += 1;
  }

  registerAll(behaviors: readonly Behavior[]): void {
    for (const behavior of behaviors) this.register(behavior);
  }

  get(id: string): Behavior | undefined {
    return this.behaviors.get(id);
  }

  require(id: string): Behavior {
    const behavior = this.get(id);
    if (!behavior) throw new Error(`未注册 Behavior：${id}`);
    return behavior;
  }

  resolve(ids: readonly string[] = []): readonly Behavior[] {
    return [...new Set(ids)].map((id) => this.require(id));
  }

  all(): readonly Behavior[] {
    return [...this.behaviors.values()];
  }
}
