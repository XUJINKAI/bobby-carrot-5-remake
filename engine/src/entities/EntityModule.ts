import type { EntityDefinition } from "../world/entity/EntityDefinition.js";
import type { VisualDefinition } from "../visual/VisualDefinition.js";

/**
 * 一种 Entity 的完整静态模块。
 * definition 保持纯 gameplay/domain；visual 与它物理同模块注册，但不反向污染 World 类型。
 */
export interface EntityModule {
  definition: EntityDefinition;
  visual?: VisualDefinition;
}

export function defineEntityModule(module: EntityModule): EntityModule {
  return module;
}
