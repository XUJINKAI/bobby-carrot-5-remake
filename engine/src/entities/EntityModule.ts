import type { Direction } from "@bobby/model";
import type { Behavior } from "../world/behavior/Behavior.js";
import type {
  AudioProfileId,
  EntityDefinition,
  EntityTrait,
  VisualId,
} from "../world/entity/EntityDefinition.js";
import type {
  VisualDefinition,
  VisualRenderPass,
} from "../visual/VisualDefinition.js";

export interface EntityPresentationDefinition {
  name: string;
  category?: string;
  visual?: VisualId;
  audio?: AudioProfileId;
  renderPass?: VisualRenderPass;
}

export interface EntityAuthoringDefinition {
  palette?: boolean;
  category?: string;
  /** 鼠标放置点相对 persisted anchor 的偏移，只影响 Editor。 */
  cursor?: { dx: number; dy: number };
  /** Palette 创建方向型 Entity 时使用的初值。 */
  defaultDirection?: Direction;
}

/**
 * Entity module 源码声明使用的完整定义。defineEntityModule 会把产品/编辑器元数据
 * 从 gameplay Definition 中拆出，因此 World/EntityRegistry 永远只看到 EntityDefinition。
 */
export interface EntityModuleDefinition extends EntityDefinition {
  presentation: EntityPresentationDefinition;
  authoring?: EntityAuthoringDefinition;
}

export interface EntityBehaviorBinding {
  behavior: Behavior;
  /** 该 trait 出现在 Definition 或实例 traits 时触发此 Behavior。省略时只作为显式 behavior。 */
  trait?: EntityTrait;
}

/** 一种 Entity 的完整产品模块；它是 gameplay、presentation、authoring 的组合边界。 */
export interface EntityModule {
  definition: EntityDefinition;
  presentation: EntityPresentationDefinition;
  authoring?: EntityAuthoringDefinition;
  visual?: VisualDefinition;
  behaviorBindings?: readonly EntityBehaviorBinding[];
}

export interface EntityModuleInput {
  definition: EntityModuleDefinition;
  visual?: VisualDefinition;
  behaviorBindings?: readonly EntityBehaviorBinding[];
}

export function defineEntityModule(input: EntityModuleInput): EntityModule {
  const { presentation, authoring, ...gameplayDefinition } = input.definition;
  const behaviorIds = input.behaviorBindings?.map(({ behavior }) => behavior.id) ?? [];
  const definition: EntityDefinition =
    behaviorIds.length === 0
      ? gameplayDefinition
      : {
          ...gameplayDefinition,
          behaviors: [
            ...new Set([...(gameplayDefinition.behaviors ?? []), ...behaviorIds]),
          ],
        };
  const visual = input.visual
    ? {
        ...input.visual,
        ...(input.visual.renderPass
          ? {}
          : presentation.renderPass
            ? { renderPass: presentation.renderPass }
            : {}),
      }
    : undefined;
  return {
    definition,
    presentation,
    ...(authoring ? { authoring } : {}),
    ...(visual ? { visual } : {}),
    ...(input.behaviorBindings
      ? { behaviorBindings: input.behaviorBindings }
      : {}),
  };
}
