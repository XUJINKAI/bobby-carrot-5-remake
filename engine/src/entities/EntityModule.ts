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

/** Presentation extent in map-cell coordinates relative to the Entity anchor. */
export interface EntityVisualBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface EntityPresentationDefinition {
  name: string;
  visual?: VisualId;
  audio?: AudioProfileId;
  renderPass?: VisualRenderPass;
  /**
   * Visual-only extent for sprites that overhang their gameplay footprint.
   * It never creates Spatial Presences or affects collision/gameplay queries.
   */
  visualBounds?: EntityVisualBounds;
}

/** Full definition used by an Entity module. Editor policy belongs to @bobby/editor. */
export interface EntityModuleDefinition extends EntityDefinition {
  presentation: EntityPresentationDefinition;
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
  visual?: VisualDefinition;
  behaviorBindings?: readonly EntityBehaviorBinding[];
}

export interface EntityModuleInput {
  definition: EntityModuleDefinition;
  visual?: VisualDefinition;
  behaviorBindings?: readonly EntityBehaviorBinding[];
}

export function defineEntityModule(input: EntityModuleInput): EntityModule {
  const { presentation, ...gameplayDefinition } = input.definition;
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
    ...(visual ? { visual } : {}),
    ...(input.behaviorBindings
      ? { behaviorBindings: input.behaviorBindings }
      : {}),
  };
}
