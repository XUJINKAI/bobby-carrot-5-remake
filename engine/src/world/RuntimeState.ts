import type { ObjectType, TerrainType } from '../data/types.js';
import type { Direction } from '../mechanics/ids.js';

export interface Point { x: number; y: number; }
export type ObjectiveMode = 'carrot' | 'nest';
export type ForcedKind = 'speed' | 'ice' | 'flight' | 'leaf' | 'mower-exit';

export interface ForcedMovement { kind: ForcedKind; direction: Direction; }

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

export interface InventoryState { gas: boolean; kite: boolean; shovel: boolean; beans: number; }
export interface ProfileCapabilities { superKey: boolean; temporaryKey: boolean; speedShoes: boolean; }

export interface RuntimeState {
  terrain: TerrainType[][];
  /** 每格至多一个静态对象；`empty` 表示空。 */
  objects: ObjectType[][];
  dynamicEntities: DynamicEntity[];
  player: Point;
  facing: Direction;
  start: Point;
  objectiveMode: ObjectiveMode;
  objectiveRemaining: number;
  objectiveTotal: number;
  inventory: InventoryState;
  profile: ProfileCapabilities;
  ridingMower: boolean;
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
  bonusTimeRemainingMs: number | null;
  bonusCoinsInLevel: number;
  goldenCarrotsInLevel: number;
  moves: number;
  dead: boolean;
  deathReason: string | null;
  completed: boolean;
  fireTrail: Point[];
  warnings: string[];
}

export type WorldSnapshot = RuntimeState;
