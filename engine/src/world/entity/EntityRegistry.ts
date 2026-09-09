import type { EntityType } from "@bobby/model";
import type { EntityDefinition } from "./EntityDefinition.js";

/** 所有内置 Entity 共用的 Definition Registry；Registry 不感知源码来源。 */
export class EntityRegistry {
  private readonly definitions = new Map<EntityType, EntityDefinition>();
  private version = 0;

  get revision(): number {
    return this.version;
  }

  register(definition: EntityDefinition): void {
    if (this.definitions.has(definition.type))
      throw new Error(`重复 Entity Definition：${definition.type}`);
    this.definitions.set(definition.type, definition);
    this.version += 1;
  }

  registerAll(definitions: readonly EntityDefinition[]): void {
    for (const definition of definitions) this.register(definition);
  }

  has(type: EntityType): boolean {
    return this.definitions.has(type);
  }

  get(type: EntityType): EntityDefinition | undefined {
    return this.definitions.get(type);
  }

  require(type: EntityType): EntityDefinition {
    const definition = this.definitions.get(type);
    if (!definition) throw new Error(`未注册 Entity Definition：${type}`);
    return definition;
  }

  all(): readonly EntityDefinition[] {
    return [...this.definitions.values()];
  }
}
