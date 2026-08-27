import type { Behavior } from "../world/behavior/Behavior.js";
import type {
  EntityDefinition,
  EntityTrait,
} from "../world/entity/EntityDefinition.js";
import type { VisualDefinition } from "../visual/VisualDefinition.js";

export interface EntityBehaviorBinding {
  behavior: Behavior;
  /** 该 trait 出现在 Definition 或实例 traits 时触发此 Behavior。省略时只作为显式 behavior。 */
  trait?: EntityTrait;
}

/**
 * 一种 Entity 的完整静态模块。
 * definition 保持纯 gameplay/domain；visual/behavior 与它物理同模块注册，但不反向污染 World 类型。
 */
export interface EntityModule {
  definition: EntityDefinition;
  visual?: VisualDefinition;
  behaviorBindings?: readonly EntityBehaviorBinding[];
}

export function defineEntityModule(module: EntityModule): EntityModule {
  const behaviorIds = module.behaviorBindings?.map(({ behavior }) => behavior.id) ?? [];
  if (behaviorIds.length === 0) return module;
  return {
    ...module,
    definition: {
      ...module.definition,
      behaviors: [
        ...new Set([...(module.definition.behaviors ?? []), ...behaviorIds]),
      ],
    },
  };
}
