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
  private pausedValue = false;

  constructor(stepMs = ENGINE_TICK_STEP_MS) {
    this.stepMs = Number.isFinite(stepMs) && stepMs > 0 ? stepMs : ENGINE_TICK_STEP_MS;
  }

  /** 下一次逻辑更新使用的时间，也用于两个 Tick 之间发起的语义动作。 */
  get nextTick(): EngineTick {
    return { tick: this.nextTickValue, stepMs: this.stepMs };
  }

  /** 已经执行过的逻辑 Tick 数量。 */
  get tickCount(): number {
    return this.nextTickValue;
  }

  get paused(): boolean {
    return this.pausedValue;
  }

  /**
   * 吸收一段真实时间并执行 0..N 个固定逻辑 Tick，返回实际执行数量。
   * 单次最多追赶 4 Tick，避免页面从后台恢复时形成更新风暴；超出的停顿视为游戏暂停。
   */
  advance(deltaMs: number, listener: EngineTickListener): number {
    if (this.pausedValue || !Number.isFinite(deltaMs) || deltaMs <= 0) return 0;
    this.accumulatorMs += Math.min(deltaMs, this.stepMs * MAX_CATCH_UP_TICKS);
    let count = 0;
    while (this.accumulatorMs >= this.stepMs && count < MAX_CATCH_UP_TICKS) {
      this.runTick(listener);
      this.accumulatorMs -= this.stepMs;
      count += 1;
    }
    return count;
  }

  /** 暂停世界时间，并丢弃不足一个 Tick 的真实时间残量。 */
  pause(): void {
    this.pausedValue = true;
    this.accumulatorMs = 0;
  }

  /** 恢复世界时间；暂停期间的真实时间不会被追赶。 */
  resume(): void {
    this.pausedValue = false;
    this.accumulatorMs = 0;
  }

  /**
   * 调试用单步推进。只允许在暂停状态执行，保证不会与 RAF 驱动的 advance() 交错。
   */
  step(count: number, listener: EngineTickListener): number {
    if (!this.pausedValue) return 0;
    const safeCount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
    for (let index = 0; index < safeCount; index += 1) this.runTick(listener);
    return safeCount;
  }

  reset(): void {
    this.accumulatorMs = 0;
    this.nextTickValue = 0;
    this.pausedValue = false;
  }

  private runTick(listener: EngineTickListener): void {
    const time = this.nextTick;
    this.nextTickValue += 1;
    listener(time);
  }
}
