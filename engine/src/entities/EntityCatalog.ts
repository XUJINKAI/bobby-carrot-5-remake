import type { EntityType } from "@bobby/model";
import type { EntityDefinition } from "../world/entity/EntityDefinition.js";
import { EntityRegistry } from "../world/entity/EntityRegistry.js";
import type {
  EntityModule,
  EntityPresentationDefinition,
} from "./EntityModule.js";

/** Generic Entity definition plus human-facing presentation metadata. */
export interface EntityCatalogEntry extends EntityDefinition {
  presentation: EntityPresentationDefinition;
}

export class EntityCatalog {
  readonly entities = new EntityRegistry();
  private readonly entries = new Map<EntityType, EntityCatalogEntry>();

  constructor(modules: readonly EntityModule[] = []) {
    for (const module of modules) this.register(module);
  }

  register(module: EntityModule): void {
    const type = module.definition.type;
    if (this.entries.has(type))
      throw new Error(`重复 Entity Catalog Entry：${type}`);
    this.entities.register(module.definition);
    this.entries.set(type, {
      ...module.definition,
      presentation: module.presentation,
    });
  }

  has(type: EntityType): boolean {
    return this.entries.has(type);
  }

  get(type: EntityType): EntityCatalogEntry | undefined {
    return this.entries.get(type);
  }

  require(type: EntityType): EntityCatalogEntry {
    const entry = this.entries.get(type);
    if (!entry) throw new Error(`未注册 Entity Catalog Entry：${type}`);
    return entry;
  }

  all(): readonly EntityCatalogEntry[] {
    return [...this.entries.values()];
  }
}
