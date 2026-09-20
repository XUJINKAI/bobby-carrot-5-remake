import type { EntityPresence } from "../world/spatial/EntityPresence.js";
import type { VisualComposition } from "../visual/VisualDefinition.js";
import type { WorldCalloutRenderItem } from "../visual/callout/WorldCallout.js";

export interface WorldOverlayItem {
  composition: VisualComposition;
  visualX: number;
  visualY: number;
}

export interface ScreenOverlayItem {
  composition: VisualComposition;
  x: number;
  y: number;
  size: number;
  /** 屏幕坐标裁剪区；用于天气只覆盖当前地图可见范围。 */
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface RenderItem {
  presence: Readonly<EntityPresence>;
  composition: VisualComposition;
  visualX: number;
  visualY: number;
  /** 直立对象的脚底排序锚点；与具体 Presence 的绘制位置正交。 */
  depthX: number;
  depthY: number;
}

export interface RenderScene {
  worldWidth: number;
  worldHeight: number;
  world: readonly RenderItem[];
  /** 静态世界之后、站立 Entity 之前绘制的 Entity 特效。 */
  worldEffect: readonly RenderItem[];
  standing: readonly RenderItem[];
  effect: readonly RenderItem[];
  /** 静态世界之后、standing Entity 之前绘制的世界坐标环境效果。 */
  ambientBackground: readonly WorldOverlayItem[];
  callouts: readonly WorldCalloutRenderItem[];
  /** Callout 之后绘制的屏幕坐标天气与生物粒子。 */
  ambientForeground: readonly ScreenOverlayItem[];
}

/**
 * 同一个 render pass 内只服从逻辑 stackOrder。
 * visualX/visualY 只决定绘制位置，绝不参与层序。
 */
export function sortRenderItems(items: readonly RenderItem[]): readonly RenderItem[] {
  return [...items].sort(compareRenderItems);
}

/** 直立对象按共享的脚底锚点排序；同一锚点才回落到实例堆叠顺序。 */
export function sortStandingRenderItems(
  items: readonly RenderItem[],
): readonly RenderItem[] {
  return [...items].sort(compareStandingRenderItems);
}

export function compareRenderItems(a: RenderItem, b: RenderItem): number {
  return (
    a.presence.stackOrder - b.presence.stackOrder ||
    a.presence.entityId - b.presence.entityId ||
    a.presence.cell.y - b.presence.cell.y ||
    a.presence.cell.x - b.presence.cell.x
  );
}

export function compareStandingRenderItems(
  a: RenderItem,
  b: RenderItem,
): number {
  return (
    a.depthY - b.depthY ||
    a.depthX - b.depthX ||
    a.presence.stackOrder - b.presence.stackOrder ||
    a.presence.entityId - b.presence.entityId ||
    a.presence.cell.y - b.presence.cell.y ||
    a.presence.cell.x - b.presence.cell.x
  );
}
