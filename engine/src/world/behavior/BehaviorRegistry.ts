import type { Behavior } from "./Behavior.js";

export class BehaviorRegistry {
  private readonly behaviors = new Map<string, Behavior>();

  register(behavior: Behavior): void {
    if (this.behaviors.has(behavior.id))
      throw new Error(`Behavior 重复注册：${behavior.id}`);
    this.behaviors.set(behavior.id, behavior);
  }

  registerAll(behaviors: readonly Behavior[]): void {
    for (const behavior of behaviors) this.register(behavior);
  }

  get(id: string): Behavior | undefined {
    return this.behaviors.get(id);
  }

  require(id: string): Behavior {
    const behavior = this.behaviors.get(id);
    if (!behavior) throw new Error(`未注册 Behavior：${id}`);
    return behavior;
  }

  all(): readonly Behavior[] {
    return [...this.behaviors.values()];
  }
}
