import type { RenderScene } from "../render/RenderScene.js";
import type { PresentationFrame } from "../time/PresentationClock.js";
import type { World } from "../world/World.js";
import type { EntityId } from "../world/entity/EntityInstance.js";
import type { EntityVisualRuntimeState } from "./VisualDefinition.js";
import type { VisualRegistry } from "./VisualRegistry.js";
import {
  buildSpatialScene,
  createIndexedSpatialSceneSource,
} from "./SpatialSceneBuilder.js";

export type VisualRuntimeState = ReadonlyMap<EntityId, EntityVisualRuntimeState>;

/** World -> VisualDefinition -> RenderScene 的唯一组装入口。 */
export function buildVisualScene(
  world: World,
  visuals: VisualRegistry,
  runtime: VisualRuntimeState,
  time?: PresentationFrame,
): RenderScene {
  // 同一次场景构建读取同一个 World；规则求值可能扫描实体，应由所有视觉共享。
  const winState = world.winState;
  return buildSpatialScene({
    source: createIndexedSpatialSceneSource(
      world.entities,
      world.spatial,
      world.registry,
    ),
    visuals,
    runtime,
    context: {
      global: world.state,
      outcome: world.outcome.state,
      winState,
      ...(time ? { time } : {}),
    },
  });
}
