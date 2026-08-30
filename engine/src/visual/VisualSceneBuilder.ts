import type { RenderItem, RenderScene } from "../render/RenderScene.js";
import { sortRenderItems } from "../render/RenderScene.js";
import type { PresentationFrame } from "../time/PresentationClock.js";
import type { World } from "../world/World.js";
import type { EntityId } from "../world/entity/EntityInstance.js";
import { SpatialVisualQuery } from "./SpatialVisualQuery.js";
import type {
  EntityVisualRuntimeState,
  VisualRenderPass,
} from "./VisualDefinition.js";
import type { VisualRegistry } from "./VisualRegistry.js";

export type VisualRuntimeState = ReadonlyMap<EntityId, EntityVisualRuntimeState>;

/** World -> VisualDefinition -> RenderScene 的唯一组装入口。 */
export function buildVisualScene(
  world: World,
  visuals: VisualRegistry,
  runtime: VisualRuntimeState,
  time?: PresentationFrame,
): RenderScene {
  const passes: Record<VisualRenderPass, RenderItem[]> = {
    world: [],
    player: [],
    effect: [],
  };
  const query = new SpatialVisualQuery(world.entities, world.spatial);

  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) {
      for (const presence of world.presencesAt({ x, y })) {
        const entity = world.entity(presence.entityId);
        if (!entity) continue;
        const visualRuntime = runtime.get(entity.id);
        const definition = world.registry.require(entity.type);
        const composition = visuals.resolve(definition, {
          entity,
          presence,
          query,
          global: world.state,
          ...(visualRuntime ? { runtime: visualRuntime } : {}),
          ...(time ? { time } : {}),
        });
        if (!composition) continue;
        passes[visuals.renderPassFor(definition)].push({
          presence,
          composition,
          visualX: x + (visualRuntime?.offsetX ?? 0),
          visualY: y + (visualRuntime?.offsetY ?? 0),
        });
      }
    }
  }

  return {
    worldWidth: world.width,
    worldHeight: world.height,
    world: sortRenderItems(passes.world),
    player: sortRenderItems(passes.player),
    effect: sortRenderItems(passes.effect),
  };
}
