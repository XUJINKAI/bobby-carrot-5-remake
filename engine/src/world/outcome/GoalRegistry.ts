import type { GoalType } from "@bobby/model";
import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type { ReachResolver } from "./ReachResolver.js";

export interface GoalResult {
  readonly completed: boolean;
  readonly remaining?: number;
}

export interface GoalContext {
  readonly query: WorldQueryApi;
  readonly reach: ReachResolver;
  readonly successfulInteractions: readonly string[];
}

export interface GoalDefinition {
  readonly type: GoalType;
  evaluate(context: GoalContext): GoalResult;
  available(query: WorldQueryApi): boolean;
}

/** World 只按 Goal ID 调用定义，具体对象选择留在各 Goal 所属领域。 */
export class GoalRegistry {
  private readonly definitions = new Map<GoalType, GoalDefinition>();

  register(definition: GoalDefinition): void {
    if (this.definitions.has(definition.type)) {
      throw new Error(`重复 Goal：${definition.type}`);
    }
    this.definitions.set(definition.type, definition);
  }

  require(type: GoalType): GoalDefinition {
    const definition = this.definitions.get(type);
    if (!definition) throw new Error(`未注册 Goal：${type}`);
    return definition;
  }
}
