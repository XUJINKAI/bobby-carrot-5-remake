export const ENGINE_TICK_RATE = 16;
export const ENGINE_TICK_STEP_MS = 1000 / ENGINE_TICK_RATE;
const MAX_CATCH_UP_TICKS = 4;

/** Engine 内统一使用的固定逻辑时间。 */
export interface EngineTick {
  /** 从 0 开始递增的逻辑 Tick 序号。 */
  tick: number;
  /** 固定逻辑步长；默认 62.5ms。 */
  stepMs: number;
}

export type EngineTickListener = (time: EngineTick) => void;

/**
 * 固定步长世界时钟。浏览器帧只负责提供真实经过时间，Input、World 与 Visual
 * 只接收稳定的 EngineTick；一次浏览器卡顿补多个逻辑 Tick 时由调用方只绘制最终状态。
 */
export class EngineClock {
  readonly stepMs: number;
  private accumulatorMs = 0;
  private nextTickValue = 0;

  constructor(stepMs = ENGINE_TICK_STEP_MS) {
    this.stepMs = Number.isFinite(stepMs) && stepMs > 0 ? stepMs : ENGINE_TICK_STEP_MS;
  }

  /** 下一次逻辑更新使用的时间，也用于两个 Tick 之间发起的语义动作。 */
  get nextTick(): EngineTick {
    return { tick: this.nextTickValue, stepMs: this.stepMs };
  }

  /**
   * 吸收一段真实时间并执行 0..N 个固定逻辑 Tick，返回实际执行数量。
   * 单次最多追赶 4 Tick，避免页面从后台恢复时形成更新风暴；超出的停顿视为游戏暂停。
   */
  advance(deltaMs: number, listener: EngineTickListener): number {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return 0;
    this.accumulatorMs += Math.min(deltaMs, this.stepMs * MAX_CATCH_UP_TICKS);
    let count = 0;
    while (this.accumulatorMs >= this.stepMs && count < MAX_CATCH_UP_TICKS) {
      const time = this.nextTick;
      this.nextTickValue += 1;
      this.accumulatorMs -= this.stepMs;
      listener(time);
      count += 1;
    }
    return count;
  }

  reset(): void {
    this.accumulatorMs = 0;
    this.nextTickValue = 0;
  }
}
