import type { EntityPresence } from "../world/spatial/EntityPresence.js";
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
  world: readonly RenderItem[];
  player: readonly RenderItem[];
  overlay: readonly RenderItem[];
}

/**
 * 同一个 render pass 内只服从逻辑 stackOrder。
 * visualX/visualY 只决定绘制位置，绝不参与层序。
 */
export function sortRenderItems(items: readonly RenderItem[]): readonly RenderItem[] {
  return [...items].sort(compareRenderItems);
}

export function compareRenderItems(a: RenderItem, b: RenderItem): number {
  return (
    a.presence.stackOrder - b.presence.stackOrder ||
    a.presence.entityId - b.presence.entityId ||
    a.presence.cell.y - b.presence.cell.y ||
    a.presence.cell.x - b.presence.cell.x
  );
}
