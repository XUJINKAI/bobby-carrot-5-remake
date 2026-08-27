import type { EntityId, EntityInstance } from "../world/entity/EntityInstance.js";
import type { EntityPresence } from "../world/spatial/EntityPresence.js";
import { stackBandOrder } from "../world/spatial/StackBand.js";
import type { World } from "../world/World.js";
import type { VisualComposition } from "../visual/VisualDefinition.js";
import type { VisualRegistry } from "../visual/VisualRegistry.js";

export interface RenderVisualRuntime {
  offsetX?: number;
  offsetY?: number;
  moving?: boolean;
  progress?: number;
}

export type RenderVisualRuntimeState = ReadonlyMap<EntityId, RenderVisualRuntime>;

export interface RenderItem {
  presence: Readonly<EntityPresence>;
  composition: VisualComposition;
  visualX: number;
  visualY: number;
}

export interface RenderScene {
  worldWidth: number;
  worldHeight: number;
  items: readonly RenderItem[];
}

/** World -> VisualDefinition -> RenderScene 的唯一组装入口。Renderer 只消费结果。 */
export function buildRenderScene(
  world: World,
  visuals: VisualRegistry,
  runtime: RenderVisualRuntimeState,
): RenderScene {
  const items: RenderItem[] = [];
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
          query: world.visualQuery,
          ...(visualRuntime ? { runtime: visualRuntime } : {}),
        });
        if (!composition) continue;
        items.push({
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
    items: sortRenderItems(items),
  };
}

export function sortRenderItems(items: readonly RenderItem[]): readonly RenderItem[] {
  return [...items].sort(compareRenderItems);
}

export function compareRenderItems(a: RenderItem, b: RenderItem): number {
  const aSurface = a.presence.stackBand === "surface";
  const bSurface = b.presence.stackBand === "surface";
  if (aSurface !== bSurface) return aSurface ? -1 : 1;

  if (aSurface && bSurface) {
    return (
      a.presence.cell.y - b.presence.cell.y ||
      a.presence.cell.x - b.presence.cell.x ||
      a.presence.stackOrder - b.presence.stackOrder ||
      a.presence.entityId - b.presence.entityId
    );
  }

  return (
    a.visualY - b.visualY ||
    stackBandOrder(a.presence.stackBand) - stackBandOrder(b.presence.stackBand) ||
    a.presence.stackOrder - b.presence.stackOrder ||
    a.visualX - b.visualX ||
    a.presence.entityId - b.presence.entityId
  );
}
