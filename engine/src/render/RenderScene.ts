import type { EntityPresence } from "../world/spatial/EntityPresence.js";
import { stackBandOrder } from "../world/spatial/StackBand.js";
import type { VisualComposition } from "../visual/VisualDefinition.js";

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
