import { ObjectId, Terrain } from '../mechanics/ids.js';
import type { RuntimeState } from '../world/RuntimeState.js';

/**
 * 原版 UP9 高清版 V() 每约 4×62ms 更新一次动画计数器。
 * 四组计数器分别循环 8 / 6 / 4 / 3 帧；计数器为 0 时使用 ts.png 静态图，
 * 大于 0 时切换到 ta.png 对应动画帧。
 */
export const ORIGINAL_ANIMATION_STEP_MS = 248;

export interface OriginalAnimationCounters {
  bC8: number;
  bD6: number;
  bE4: number;
  bF3: number;
}

export interface AnimatedTile {
  /** ta.png 中按“从左到右、从上到下”的线性序号。高清版 ta.png 为 4 列。 */
  taIndex: number;
}

export function originalAnimationCounters(elapsedMs: number): OriginalAnimationCounters {
  const step = Math.max(0, Math.floor(elapsedMs / ORIGINAL_ANIMATION_STEP_MS));
  return {
    bC8: step % 8,
    bD6: step % 6,
    bE4: step % 4,
    bF3: step % 3
  };
}

function frameFromPhase(base: number, phase: number): AnimatedTile | null {
  return phase === 0 ? null : { taIndex: base + phase - 1 };
}

/**
 * 从原版 a(byte,int,int) 与 V() 字节码恢复的“地形 → ta.png”映射。
 * 返回 null 表示这一拍继续画 ts.png 静态格。
 */
export function animatedTerrainTile(id: number, state: Readonly<RuntimeState>, elapsedMs: number): AnimatedTile | null {
  const { bC8, bE4, bF3 } = originalAnimationCounters(elapsedMs);

  if (id === Terrain.EXIT && state.objectiveRemaining === 0) return frameFromPhase(0, bE4);

  switch (id) {
    case 0x56: return frameFromPhase(39, bC8);
    case Terrain.TIDE_UP: return frameFromPhase(33, bF3);
    case Terrain.TIDE_DOWN: return frameFromPhase(31, bF3);
    case Terrain.TIDE_LEFT: return frameFromPhase(37, bF3);
    case Terrain.TIDE_RIGHT: return frameFromPhase(35, bF3);
    case 0x5b: return frameFromPhase(46, bF3);
    case 0x5c: return frameFromPhase(48, bF3);
    case 0x5d: return frameFromPhase(50, bF3);

    case Terrain.SPEED_UP: return frameFromPhase(3, bE4);
    case Terrain.SPEED_DOWN: return frameFromPhase(6, bE4);
    case Terrain.SPEED_LEFT: return frameFromPhase(9, bE4);
    case Terrain.SPEED_RIGHT: return frameFromPhase(12, bE4);
    default: return null;
  }
}

/** 从原版对象渲染分支恢复的动态对象动画。 */
export function animatedObjectTile(id: number, state: Readonly<RuntimeState>, elapsedMs: number): AnimatedTile | null {
  const { bD6, bE4, bF3 } = originalAnimationCounters(elapsedMs);

  // 原版 Bonus Coin 还带一个随机闪烁门控；Web 版保留同一帧序列，持续播放以避免随机测试不稳定。
  if (id === ObjectId.BONUS_COIN) return frameFromPhase(15, bE4);
  if (id === ObjectId.WHIRLWIND) return frameFromPhase(26, bD6);

  switch (id) {
    case ObjectId.WINDMILL_UP: return state.windmillsEnabled[0] ? frameFromPhase(18, bF3) : null;
    case ObjectId.WINDMILL_DOWN: return state.windmillsEnabled[1] ? frameFromPhase(20, bF3) : null;
    case ObjectId.WINDMILL_LEFT: return state.windmillsEnabled[2] ? frameFromPhase(22, bF3) : null;
    case ObjectId.WINDMILL_RIGHT: return state.windmillsEnabled[3] ? frameFromPhase(24, bF3) : null;
    default: return null;
  }
}
