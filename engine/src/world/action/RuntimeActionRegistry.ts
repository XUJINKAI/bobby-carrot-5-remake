import type { RuntimeActionDefinition } from "./RuntimeAction.js";

export class RuntimeActionRegistry {
  private readonly definitions = new Map<string, RuntimeActionDefinition>();

  register(definition: RuntimeActionDefinition): void {
    const registered = this.definitions.get(definition.kind);
    // 多个 EntityModule 可以显式声明同一份共享 Action；对象身份保证它们引用同一定义。
    if (registered === definition) return;
    if (registered)
      throw new Error(`重复 RuntimeAction：${definition.kind}`);
    this.definitions.set(definition.kind, definition);
  }

  registerAll(definitions: readonly RuntimeActionDefinition[]): void {
    for (const definition of definitions) this.register(definition);
  }

  get(kind: string): RuntimeActionDefinition | undefined {
    return this.definitions.get(kind);
  }

  require(kind: string): RuntimeActionDefinition {
    const definition = this.get(kind);
    if (!definition) throw new Error(`未注册 RuntimeAction：${kind}`);
    return definition;
  }
}
