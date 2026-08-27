import type { LevelEntity } from "@bobby/model";
import type {
  EntityDefinition,
  VisualId,
} from "../world/entity/EntityDefinition.js";
import type {
  VisualComposition,
  VisualDefinition,
  VisualResolveContext,
} from "./VisualDefinition.js";

export class VisualRegistry {
  private readonly definitions = new Map<VisualId, VisualDefinition>();

  register(definition: VisualDefinition): void {
    if (this.definitions.has(definition.id))
      throw new Error(`重复 Visual Definition：${definition.id}`);
    const persisted = definition.authoring?.persistedVariant;
    if (persisted && persisted.values.length === 0)
      throw new Error(`Visual ${definition.id} 的 persistedVariant values 不能为空`);
    this.definitions.set(definition.id, definition);
  }

  registerAll(definitions: readonly VisualDefinition[]): void {
    for (const definition of definitions) this.register(definition);
  }

  get(id: VisualId): VisualDefinition | undefined {
    return this.definitions.get(id);
  }

  require(id: VisualId): VisualDefinition {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error(`未注册 Visual Definition：${id}`);
    return definition;
  }

  all(): readonly VisualDefinition[] {
    return [...this.definitions.values()];
  }

  visualIdFor(entityDefinition: EntityDefinition): VisualId {
    return entityDefinition.presentation.visual ?? entityDefinition.type;
  }

  resolve(
    entityDefinition: EntityDefinition,
    context: VisualResolveContext,
  ): VisualComposition | null {
    return this.get(this.visualIdFor(entityDefinition))?.resolve(context) ?? null;
  }

  /**
   * Editor 创建实例时调用一次。若 Visual 声明 persistedVariant，则按
   * type + anchor + placementSequence 的稳定 hash 选择一个值并写入 properties。
   */
  initializeAuthoringEntity(
    source: LevelEntity,
    entityDefinition: EntityDefinition,
    placementSequence: number,
  ): LevelEntity {
    const visual = this.get(this.visualIdFor(entityDefinition));
    const persisted = visual?.authoring?.persistedVariant;
    if (!persisted) return source;
    if (source.properties?.[persisted.property] !== undefined) return source;

    const index = deterministicVisualVariantIndex(
      source.type,
      source.x,
      source.y,
      placementSequence,
      persisted.values.length,
    );
    const selected = persisted.values[index];
    if (selected === undefined) return source;
    return {
      ...source,
      properties: {
        ...(source.properties ?? {}),
        [persisted.property]: structuredClone(selected),
      },
    };
  }
}

export function deterministicVisualVariantIndex(
  entityType: string,
  x: number,
  y: number,
  placementSequence: number,
  variantCount: number,
): number {
  if (!Number.isInteger(variantCount) || variantCount <= 0)
    throw new Error(`variantCount 必须是正整数：${variantCount}`);
  const input = `${entityType}\u0000${x}\u0000${y}\u0000${placementSequence}`;
  return stableVisualHash(input) % variantCount;
}

/** FNV-1a 32-bit；只要求跨运行稳定，不承担安全用途。 */
export function stableVisualHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
