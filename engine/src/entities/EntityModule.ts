import type { RuntimeActionDefinition } from "../world/action/RuntimeAction.js";
import type { Behavior } from "../world/behavior/Behavior.js";
import type {
  AudioProfileId,
  EntityDefinition,
  EntityTrait,
  VisualId,
} from "../world/entity/EntityDefinition.js";
import type {
  TransientVisualDefinition,
  VisualDefinition,
  VisualRenderPass,
} from "../visual/VisualDefinition.js";

export interface EntityPresentationDefinition {
  name: string;
  visual?: VisualId;
  audio?: AudioProfileId;
  renderPass?: VisualRenderPass;
}

export interface EntityAuthoringDefinition {
  /** false 表示该 Runtime Entity 只能由关卡加载或 gameplay 生成。 */
  palette?: boolean;
}

/** Full definition used by an Entity module. Editor policy belongs to @bobby/editor. */
export interface EntityModuleDefinition extends EntityDefinition {
  presentation: EntityPresentationDefinition;
  authoring?: EntityAuthoringDefinition;
}

export interface EntityBehaviorBinding {
  behavior: Behavior;
  /** 该 trait 出现在 Definition 或实例 traits 时触发此 Behavior。省略时只作为显式 behavior。 */
  trait?: EntityTrait;
}

/** 一种 Entity 的完整 Engine 模块：gameplay + generic presentation。 */
export interface EntityModule {
  definition: EntityDefinition;
  presentation: EntityPresentationDefinition;
  authoring?: EntityAuthoringDefinition;
  visual?: VisualDefinition;
  transientVisuals?: readonly TransientVisualDefinition[];
  behaviorBindings?: readonly EntityBehaviorBinding[];
  /** 仅此 Entity 机制需要的跨 WorldTick gameplay 过程。 */
  runtimeActions?: readonly RuntimeActionDefinition[];
}

export interface EntityModuleInput {
  definition: EntityModuleDefinition;
  visual?: VisualDefinition;
  transientVisuals?: readonly TransientVisualDefinition[];
  behaviorBindings?: readonly EntityBehaviorBinding[];
  runtimeActions?: readonly RuntimeActionDefinition[];
}

export function defineEntityModule(input: EntityModuleInput): EntityModule {
  const { presentation, authoring, ...gameplayDefinition } = input.definition;
  const behaviorIds =
    input.behaviorBindings?.map(({ behavior }) => behavior.id) ?? [];
  const definition: EntityDefinition =
    behaviorIds.length === 0
      ? gameplayDefinition
      : {
          ...gameplayDefinition,
          behaviors: [
            ...new Set([
              ...(gameplayDefinition.behaviors ?? []),
              ...behaviorIds,
            ]),
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
    ...(input.transientVisuals
      ? { transientVisuals: input.transientVisuals }
      : {}),
    ...(input.behaviorBindings
      ? { behaviorBindings: input.behaviorBindings }
      : {}),
    ...(input.runtimeActions ? { runtimeActions: input.runtimeActions } : {}),
  };
}
