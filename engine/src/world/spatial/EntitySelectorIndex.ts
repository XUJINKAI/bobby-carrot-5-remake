import type { EntityDefinition } from "../entity/EntityDefinition.js";
import type { EntityId, EntityInstance } from "../entity/EntityInstance.js";
import type { EntityPresence } from "./EntityPresence.js";

/** 与空间 Presence 同步维护语义索引；多格 Trait 按 Entity 去重。 */
export class EntitySelectorIndex {
  private readonly traits = new Map<string, Set<EntityId>>();
  private readonly types = new Map<string, Set<EntityId>>();
  private readonly entries = new Map<EntityId, { type: string; traits: Set<string> }>();

  clear(): void {
    this.traits.clear();
    this.types.clear();
    this.entries.clear();
  }

  add(entity: EntityInstance, definition: EntityDefinition, presences: readonly EntityPresence[]): void {
    this.remove(entity.id);
    const traits = new Set([
      ...definition.traits,
      ...(entity.instanceTraits ?? []),
      ...presences.flatMap((presence) => [...presence.traits]),
    ]);
    this.entries.set(entity.id, { type: entity.type, traits });
    addTo(this.types, entity.type, entity.id);
    for (const trait of traits) addTo(this.traits, trait, entity.id);
  }

  remove(id: EntityId): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    removeFrom(this.types, entry.type, id);
    for (const trait of entry.traits) removeFrom(this.traits, trait, id);
    this.entries.delete(id);
  }

  withTrait(trait: string): EntityId[] {
    return ordered(this.traits.get(trait) ?? []);
  }

  ofType(type: string): EntityId[] {
    return ordered(this.types.get(type) ?? []);
  }

  matching(selector: string): EntityId[] {
    return ordered(new Set([
      ...(this.types.get(selector) ?? []),
      ...(this.traits.get(selector) ?? []),
    ]));
  }
}

function ordered(ids: Iterable<EntityId>): EntityId[] {
  // 移动会重新插入索引；查询仍保持确定性 identity 顺序，尤其是多玩家默认目标。
  return [...ids].sort((a, b) => a - b);
}

function addTo(index: Map<string, Set<EntityId>>, key: string, id: EntityId): void {
  const ids = index.get(key) ?? new Set<EntityId>();
  ids.add(id);
  index.set(key, ids);
}

function removeFrom(index: Map<string, Set<EntityId>>, key: string, id: EntityId): void {
  const ids = index.get(key);
  ids?.delete(id);
  if (ids?.size === 0) index.delete(key);
}
