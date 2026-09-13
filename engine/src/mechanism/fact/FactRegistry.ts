export type FactId = string;

export interface FactDefinition {
  readonly id: FactId;
  readonly description: string;
}

/** Fact ID 的声明与校验入口；Fact 的成立本身不触发任何 Behavior。 */
export class FactRegistry {
  private readonly definitions = new Map<string, FactDefinition>();

  register(definition: FactDefinition): void {
    if (!definition.id || !definition.description) {
      throw new Error("Fact 必须声明非空 ID 与中文语义说明");
    }
    if (this.definitions.has(definition.id)) {
      throw new Error(`重复 Fact：${definition.id}`);
    }
    this.definitions.set(definition.id, definition);
  }

  registerAll(definitions: readonly FactDefinition[]): void {
    for (const definition of definitions) this.register(definition);
  }

  require(id: string): FactDefinition {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error(`未注册 Fact：${id}`);
    return definition;
  }

  all(): readonly FactDefinition[] {
    return [...this.definitions.values()];
  }
}
