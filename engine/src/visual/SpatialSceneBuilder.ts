import type { RenderItem, RenderScene } from "../render/RenderScene.js";
import {
  sortRenderItems,
  sortStandingRenderItems,
} from "../render/RenderScene.js";
import type { PresentationFrame } from "../time/PresentationClock.js";
import type { GlobalState } from "../world/GlobalState.js";
import type { EntityDefinition } from "../world/entity/EntityDefinition.js";
import type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "../world/entity/EntityInstance.js";
import type { EntityRegistry } from "../world/entity/EntityRegistry.js";
import type { WorldOutcomeState } from "../world/outcome/WorldOutcome.js";
import type { EntityPresence } from "../world/spatial/EntityPresence.js";
import type { SpatialIndex } from "../world/spatial/SpatialIndex.js";
import type { EntityStore } from "../world/entity/EntityStore.js";
import type { WinConditionState } from "../world/WorldTypes.js";
import { SpatialVisualQuery } from "./SpatialVisualQuery.js";
import type {
  AmbientVisualState,
  EntityVisualRuntimeState,
  VisualComposition,
  VisualQuery,
  VisualRenderPass,
  VisualResolveContext,
} from "./VisualDefinition.js";
import type { VisualRegistry } from "./VisualRegistry.js";

export interface SpatialSceneSource {
  readonly width: number;
  readonly height: number;
  readonly query: VisualQuery;
  presencesAt(cell: CellPosition): readonly EntityPresence[];
  entity(id: EntityId): Readonly<EntityInstance> | undefined;
  definition(entity: Readonly<EntityInstance>): EntityDefinition;
}

export interface SpatialSceneContext {
  global?: Readonly<GlobalState>;
  outcome?: Readonly<WorldOutcomeState>;
  winState?: Readonly<WinConditionState> | null;
  time?: PresentationFrame;
  ambient?: Readonly<AmbientVisualState>;
}

export interface BuildSpatialSceneOptions {
  source: SpatialSceneSource;
  visuals: VisualRegistry;
  runtime?: ReadonlyMap<EntityId, EntityVisualRuntimeState>;
  context?: SpatialSceneContext;
  resolveVisual?: (
    definition: EntityDefinition,
    context: VisualResolveContext,
  ) => VisualComposition | null;
}

/**
 * 已展开的空间投影到 RenderScene 的唯一纯组装器。
 * Runtime 与 Editor 只提供各自 source/context；pass、depth 与排序语义保持一致。
 */
export function buildSpatialScene(
  options: BuildSpatialSceneOptions,
): RenderScene {
  const { source, visuals, context = {} } = options;
  const runtime = options.runtime ?? new Map();
  const passes: Record<VisualRenderPass, RenderItem[]> = {
    world: [],
    standing: [],
    effect: [],
  };

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      for (const presence of source.presencesAt({ x, y })) {
        const entity = source.entity(presence.entityId);
        if (!entity) continue;
        const visualRuntime = runtime.get(entity.id);
        const definition = source.definition(entity);
        const resolveContext: VisualResolveContext = {
          ...context,
          entity,
          presence,
          query: source.query,
          ...(visualRuntime ? { runtime: visualRuntime } : {}),
        };
        const composition = options.resolveVisual
          ? options.resolveVisual(definition, resolveContext)
          : visuals.resolve(definition, resolveContext);
        if (!composition) continue;
        passes[visuals.renderPassFor(definition)].push({
          presence,
          composition,
          visualX: x + (visualRuntime?.offsetX ?? 0),
          visualY: y + (visualRuntime?.offsetY ?? 0),
          depthX: entity.anchor.x + (visualRuntime?.offsetX ?? 0),
          depthY: entity.anchor.y + (visualRuntime?.offsetY ?? 0),
        });
      }
    }
  }

  return {
    worldWidth: source.width,
    worldHeight: source.height,
    world: sortRenderItems(passes.world),
    standing: sortStandingRenderItems(passes.standing),
    effect: sortRenderItems(passes.effect),
    ambientBackground: [],
    callouts: [],
    ambientForeground: [],
  };
}

/** EntityStore + SpatialIndex 的 Runtime/Authoring 共用 source adapter。 */
export function createIndexedSpatialSceneSource(
  entities: EntityStore,
  spatial: SpatialIndex,
  registry: EntityRegistry,
  options: {
    query?: VisualQuery;
    entity?: (id: EntityId) => Readonly<EntityInstance> | undefined;
  } = {},
): SpatialSceneSource {
  const query = options.query ?? new SpatialVisualQuery(entities, spatial);
  return {
    width: spatial.width,
    height: spatial.height,
    query,
    presencesAt: (cell) => spatial.presencesAt(cell),
    entity: options.entity ?? ((id) => entities.get(id)),
    definition: (entity) => registry.require(entity.type),
  };
}
