import type {
  LevelObjectProperties,
  ObjectType,
  TerrainType,
} from "../data/types.js";
import type { Direction } from "../mechanics/ids.js";
import type {
  BobbyActorState,
  ActorPosition,
} from "../actors/types.js";
export type { InventoryState, ProfileCapabilities } from "../actors/types.js";

export interface Point extends ActorPosition {}
export type ObjectiveMode = "carrot" | "nest";
export type ForcedKind = "speed" | "ice" | "flight" | "leaf" | "mower-exit";

export interface ForcedMovement {
  kind: ForcedKind;
  direction: Direction;
}

export interface DynamicEntity {
  type: ObjectType;
  x: number;
  y: number;
  direction: Direction | null;
  rider: boolean;
  settled: boolean;
  offsetXpx: number;
  offsetYpx: number;
}

export interface BeanstalkGrowth {
  x: number;
  baseY: number;
  stage: number;
  ticksUntilGrowth: number;
}

export interface RuntimeState extends BobbyActorState {
  terrain: TerrainType[][];
  /** 每格至多一个静态对象；`empty` 表示空。 */
  objects: ObjectType[][];
  /** 与静态对象格同步移动，供 Definition behavior 读取实例参数。 */
  objectProperties: (LevelObjectProperties | undefined)[][];
  dynamicEntities: DynamicEntity[];
  start: Point;
  objectiveMode: ObjectiveMode;
  objectiveRemaining: number;
  objectiveTotal: number;
  forced: ForcedMovement | null;
  pendingTrap: Point | null;
  pendingCarousel: Point | null;
  pendingMirror: Point | null;
  pendingNest: Point | null;
  pendingPlank: Point | null;
  previousCrumblingPlank: Point | null;
  windmillsEnabled: [boolean, boolean, boolean, boolean];
  beanstalkGrowth: BeanstalkGrowth[];
  logicRemainderMs: number;
  bonusCoinsInLevel: number;
  goldenCarrotsInLevel: number;
  deathReason: string | null;
  completed: boolean;
  fireTrail: Point[];
  warnings: string[];
}

export type WorldSnapshot = RuntimeState;
