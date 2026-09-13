import type { Behavior } from "../world/behavior/Behavior.js";
import type {
  PassagePipelineMechanism,
  PushPipelineMechanism,
} from "../world/movement/MovementPipeline.js";

export type MechanismId = string;

export interface EntityMechanismDefinition {
  readonly id: MechanismId;
  readonly behaviors: readonly Behavior[];
}

/** 通用规则注册表只保存协议实现；具体对象的组合由 Entity Definition 声明。 */
export class MechanismRegistry {
  private readonly definitions = new Map<MechanismId, EntityMechanismDefinition>();
  private passage: PassagePipelineMechanism | undefined;
  private push: PushPipelineMechanism | undefined;
  private version = 0;

  get revision(): number {
    return this.version;
  }

  register(definition: EntityMechanismDefinition): void {
    if (this.definitions.has(definition.id)) {
      throw new Error(`重复 Mechanism：${definition.id}`);
    }
    this.definitions.set(definition.id, definition);
    this.version += 1;
  }

  registerAll(definitions: readonly EntityMechanismDefinition[]): void {
    for (const definition of definitions) this.register(definition);
  }

  registerPassage(definition: PassagePipelineMechanism): void {
    if (this.passage) throw new Error("重复 Passage Pipeline Mechanism");
    this.passage = definition;
    this.version += 1;
  }

  registerPush(definition: PushPipelineMechanism): void {
    if (this.push) throw new Error("重复 Push Pipeline Mechanism");
    this.push = definition;
    this.version += 1;
  }

  requirePassage(): PassagePipelineMechanism {
    if (!this.passage) throw new Error("缺少 Passage Pipeline Mechanism");
    return this.passage;
  }

  requirePush(): PushPipelineMechanism {
    if (!this.push) throw new Error("缺少 Push Pipeline Mechanism");
    return this.push;
  }

  require(id: MechanismId): EntityMechanismDefinition {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error(`未注册 Mechanism：${id}`);
    return definition;
  }

  behaviorsFor(ids: readonly MechanismId[] = []): readonly Behavior[] {
    const behaviors = new Map<string, Behavior>();
    for (const id of ids) {
      for (const behavior of this.require(id).behaviors) {
        if (!behaviors.has(behavior.id)) behaviors.set(behavior.id, behavior);
      }
    }
    return [...behaviors.values()];
  }

  all(): readonly EntityMechanismDefinition[] {
    return [...this.definitions.values()];
  }
}
