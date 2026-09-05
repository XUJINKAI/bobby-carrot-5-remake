import type { EntityType } from "@bobby/model";
import type {
  EntityDefinition,
  VisualId,
} from "../world/entity/EntityDefinition.js";
import type {
  TransientVisualDefinition,
  VisualComposition,
  VisualDefinition,
  VisualRenderPass,
  VisualResolveContext,
} from "./VisualDefinition.js";

export class VisualRegistry {
  private readonly definitions = new Map<VisualId, VisualDefinition>();
  private readonly entityVisuals = new Map<EntityType, VisualId>();
  private readonly transientByEvent = new Map<string, TransientVisualDefinition>();

  register(definition: VisualDefinition): void {
    if (this.definitions.has(definition.id))
      throw new Error(`重复 Visual Definition：${definition.id}`);
    this.definitions.set(definition.id, definition);
  }

  registerAll(definitions: readonly VisualDefinition[]): void {
    for (const definition of definitions) this.register(definition);
  }

  registerTransient(definition: TransientVisualDefinition): void {
    if (this.transientByEvent.has(definition.eventType))
      throw new Error(`重复 transient visual event：${definition.eventType}`);
    this.transientByEvent.set(definition.eventType, definition);
  }

  transientForEvent(eventType: string): TransientVisualDefinition | undefined {
    return this.transientByEvent.get(eventType);
  }

  bindEntityVisual(type: EntityType, visualId: VisualId): void {
    this.entityVisuals.set(type, visualId);
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
    return this.entityVisuals.get(entityDefinition.type) ?? entityDefinition.type;
  }

  renderPassFor(entityDefinition: EntityDefinition): VisualRenderPass {
    return this.get(this.visualIdFor(entityDefinition))?.renderPass ?? "world";
  }

  resolve(
    entityDefinition: EntityDefinition,
    context: VisualResolveContext,
  ): VisualComposition | null {
    return this.get(this.visualIdFor(entityDefinition))?.resolve(context) ?? null;
  }
}
