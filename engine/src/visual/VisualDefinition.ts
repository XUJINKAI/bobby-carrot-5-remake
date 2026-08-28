import type { JsonValue } from "@bobby/model";
import type { PresentationFrame } from "../time/PresentationClock.js";
import type { VisualId } from "../world/entity/EntityDefinition.js";
import type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "../world/entity/EntityInstance.js";
import type { EntityPresence } from "../world/spatial/EntityPresence.js";

export type QuarterTurn = 0 | 1 | 2 | 3;

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
  /** sprite 单帧源宽度；省略时整张图宽作为一帧。 */
  frameWidth?: number;
  /** 规则网格 sprite sheet 的单帧源高度；省略时整张图高作为一行。 */
  frameHeight?: number;
  /** 规则网格中的绝对帧序号，按从左到右、从上到下计算。 */
  frameIndex?: number;
  /** 0..1 的 strip / sheet 进度；frameIndex 存在时优先使用 frameIndex。 */
  frameProgress?: number;
  anchor?: "center" | "bottom" | "fill";
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
  previewStyle?: Readonly<Record<string, string>>;
}

export type VisualLayer = AtlasVisualLayer | ImageVisualLayer | CanvasVisualLayer;

export interface VisualComposition {
  layers: readonly VisualLayer[];
}

/** Runtime / Editor 共用的视觉资源地址表。 */
export interface VisualAssetSources {
  atlasUrl: string;
  imageUrls?: Readonly<Record<string, string>>;
  sourceTileSize?: number;
}

/** 纯视觉瞬态状态，不进入 World snapshot / LevelMap。 */
export interface EntityVisualRuntimeState {
  offsetX?: number;
  offsetY?: number;
  moving?: boolean;
  progress?: number;
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
  /** Runtime 中当前表现帧；Editor preview 可省略。不得用于 gameplay 判定。 */
  time?: PresentationFrame;
}

export interface PersistedVisualVariantDefinition {
  property: string;
  values: readonly JsonValue[];
}

export interface VisualAuthoringDefinition {
  persistedVariant?: PersistedVisualVariantDefinition;
}

/** 一种 Entity 的表现解析逻辑。Visual 可以读取任意格的只读 World 信息。 */
export interface VisualDefinition {
  id: VisualId;
  authoring?: VisualAuthoringDefinition;
  resolve(context: VisualResolveContext): VisualComposition | null;
}
