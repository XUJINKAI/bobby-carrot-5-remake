import type { Direction } from "@bobby/model";
import type { PresentationFrame } from "../time/PresentationClock.js";
import type { GlobalState } from "../world/GlobalState.js";
import type { VisualId } from "../world/entity/EntityDefinition.js";
import type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "../world/entity/EntityInstance.js";
import type { WorldEvent } from "../world/WorldTypes.js";
import type { EntityPresence } from "../world/spatial/EntityPresence.js";

export type QuarterTurn = 0 | 1 | 2 | 3;
export type VisualRenderPass = "world" | "player" | "effect";

export interface AtlasVisualLayer {
  kind: "atlas";
  column: number;
  row: number;
  rotate?: QuarterTurn;
  flipX?: boolean;
  flipY?: boolean;
}

/** 独立图片、横向 sprite strip 或规则网格 sprite sheet。asset 是语义资源 ID，不是 URL。 */
export interface ImageVisualLayer {
  kind: "image";
  asset: string;
  /** sprite 单帧源宽度；省略时可由 frameColumns 推导。 */
  frameWidth?: number;
  /** 规则网格 sprite sheet 的单帧源高度；省略时可由 frameRows 推导。 */
  frameHeight?: number;
  /** sprite sheet 的列数。用于不应在 Entity 中硬编码源图像素尺寸的规则网格。 */
  frameColumns?: number;
  /** sprite sheet 的行数。用于不应在 Entity 中硬编码源图像素尺寸的规则网格。 */
  frameRows?: number;
  /** 规则网格中的绝对帧序号，按从左到右、从上到下计算。 */
  frameIndex?: number;
  /** 0..1 的 strip / sheet 进度；frameIndex 存在时优先使用 frameIndex。 */
  frameProgress?: number;
  anchor?: "center" | "bottom" | "fill";
  /** 相对锚点的原始素材像素偏移；Renderer 会随 tile 缩放。 */
  offsetX?: number;
  /** 相对锚点的原始素材像素偏移；Renderer 会随 tile 缩放。 */
  offsetY?: number;
}

/** 少量程序化视觉使用的通用 Canvas layer。 */
export interface CanvasVisualLayer {
  kind: "canvas";
  draw(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
  ): void;
}

export type VisualLayer = AtlasVisualLayer | ImageVisualLayer | CanvasVisualLayer;

export interface VisualComposition {
  layers: readonly VisualLayer[];
}

/** 纯视觉瞬态状态，不进入 World snapshot / LevelMap。 */
export interface EntityVisualRuntimeState {
  offsetX?: number;
  offsetY?: number;
  moving?: boolean;
  progress?: number;
  /** 上一次进入静止状态的 PresentationTime；供 Entity 自己决定何时进入 idle。 */
  stationarySinceMs?: number;
  /** 纯表现动作名；例如 shovel。不得被 gameplay 读取。 */
  animation?: string;
  /** blocked action 也可以用尝试方向覆盖当前 gameplay facing。 */
  direction?: Direction;
}

/** Visual resolver 只能查询 World；不能通过此接口修改 gameplay。 */
export interface VisualQuery {
  inBounds(cell: CellPosition): boolean;
  presencesAt(cell: CellPosition): readonly EntityPresence[];
  entity(id: EntityId): Readonly<EntityInstance> | undefined;
}

export interface VisualResolveContext {
  entity: Readonly<EntityInstance>;
  presence: Readonly<EntityPresence>;
  query: VisualQuery;
  runtime?: Readonly<EntityVisualRuntimeState>;
  /** Runtime 可以提供只读全局 gameplay 状态；Editor preview 可省略。 */
  global?: Readonly<GlobalState>;
  /** Runtime 中当前表现帧；Editor preview 可省略。不得用于 gameplay 判定。 */
  time?: PresentationFrame;
}

/** 一种 Entity 的表现解析逻辑。Visual 可以读取任意格的只读 World 信息。 */
export interface VisualDefinition {
  id: VisualId;
  /** 固定渲染 pass；默认 world。它只影响表现，不进入 World/Spatial。 */
  renderPass?: VisualRenderPass;
  resolve(context: VisualResolveContext): VisualComposition | null;
}

/**
 * World gameplay 已经结束后仍可继续播放的短暂视觉。它由语义 WorldEvent 启动，
 * 只存在于 PresentationTime，不进入 EntityStore、Spatial 或 World snapshot。
 */
export interface TransientVisualDefinition {
  id: string;
  eventType: string;
  durationMs: number;
  renderPass?: VisualRenderPass;
  stackOrder?: number;
  resolve(context: {
    event: Readonly<WorldEvent>;
    progress: number;
    time: PresentationFrame;
  }): VisualComposition | null;
}
