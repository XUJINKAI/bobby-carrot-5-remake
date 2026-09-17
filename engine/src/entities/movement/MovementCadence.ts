import type { RuntimeActionInstance } from "../../world/action/RuntimeAction.js";
import { quantizedActionCadenceMs } from "../../world/action/ActionDeadline.js";

/** 原版实测移动的两档整格墙钟时间。 */
export const ORIGINAL_MOVEMENT_CADENCE = {
  slowCellMs: 416,
  fastCellMs: 208,
} as const;

/** Bobby Carrot 5 Remake 为玩家操作调校的两档整格墙钟时间。 */
export const BOBBY_MOVEMENT_CADENCE = {
  normalCellMs: 350,
  fastCellMs: 175,
} as const;

export interface ActionMovementCadence {
  readonly cellMs: number;
  /** 连续 RuntimeAction 是否结转固定 World tick 造成的逐格舍入余量。 */
  readonly quantizeActionMotion: boolean;
}

export const BOBBY_MOVEMENT = {
  normalCellMs: BOBBY_MOVEMENT_CADENCE.normalCellMs,
  speedShoesCellMs: BOBBY_MOVEMENT_CADENCE.fastCellMs,
  quantizeActionMotion: false,
} as const;

/** Mower 与乘坐它的 Bobby 共用同一次 WorldMotion。 */
export const MOWER_MOVEMENT = {
  normalCellMs: BOBBY_MOVEMENT_CADENCE.normalCellMs,
  speedCellMs: BOBBY_MOVEMENT_CADENCE.fastCellMs,
  quantizeActionMotion: false,
} as const;

/** Ice 优先继承进入它的 motion；这里的两档只作为默认策略与审阅基准。 */
export const ICE_MOVEMENT = {
  normalCellMs: BOBBY_MOVEMENT_CADENCE.normalCellMs,
  fastCellMs: BOBBY_MOVEMENT_CADENCE.fastCellMs,
  inheritsEnteringMotion: true,
  quantizeActionMotion: false,
} as const;

export const SPEED_MOVEMENT = {
  full: {
    cellMs: BOBBY_MOVEMENT_CADENCE.fastCellMs,
    quantizeActionMotion: true,
  },
  /** 最后一格恢复 actor 自身的普通 locomotion cadence。 */
  normalRunoutCellMs: BOBBY_MOVEMENT_CADENCE.normalCellMs,
} as const;

export const CLOUD_MOVEMENT = {
  cellMs: ORIGINAL_MOVEMENT_CADENCE.slowCellMs,
  quantizeActionMotion: true,
} as const;

export const LEAF_MOVEMENT = {
  normal: {
    cellMs: ORIGINAL_MOVEMENT_CADENCE.slowCellMs,
    quantizeActionMotion: true,
  },
  waterfall: {
    cellMs: ORIGINAL_MOVEMENT_CADENCE.fastCellMs,
    quantizeActionMotion: true,
  },
} as const;

export const KITE_FLIGHT_MOVEMENT = {
  cellMs: ORIGINAL_MOVEMENT_CADENCE.fastCellMs,
  quantizeActionMotion: true,
} as const;

export const FIREBALL_MOVEMENT = {
  cellMs: ORIGINAL_MOVEMENT_CADENCE.fastCellMs,
  frameMs: ORIGINAL_MOVEMENT_CADENCE.fastCellMs / 2,
  terminalMs: ORIGINAL_MOVEMENT_CADENCE.fastCellMs / 2,
  quantizeActionMotion: true,
} as const;

/** Bean 使用 elapsed 余量连续计时，不创建逐格 WorldMotion。 */
export const BEAN_GROWTH_TIMING = {
  segmentMs: ORIGINAL_MOVEMENT_CADENCE.slowCellMs,
  quantizeActionMotion: false,
} as const;

/**
 * 将 Entity 选择的 cadence 映射到固定 World tick；是否量化完全由集中配置决定。
 */
export function resolveActionMovementCadenceMs(
  action: RuntimeActionInstance,
  movement: ActionMovementCadence,
  stepMs: number,
): number {
  return movement.quantizeActionMotion
    ? quantizedActionCadenceMs(action, movement.cellMs, stepMs)
    : movement.cellMs;
}
