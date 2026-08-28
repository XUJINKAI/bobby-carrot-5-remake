import { DEFAULT_WORLD_HZ } from "./EngineTiming.js";

const MAX_CATCH_UP_TICKS = 4;

/** World / gameplay 唯一固定逻辑时间。 */
export interface WorldTick {
  /** 从 0 开始递增的逻辑 Tick 序号。 */
  tick: number;
  /** 当前 WorldClock 的固定逻辑步长。 */
  stepMs: number;
}

export type WorldTickListener = (time: WorldTick) => void;

/**
 * 固定步长 gameplay 时钟。RAF 只提供真实经过时间；Input、World、Behavior 与
 * RuntimeAction 只接收稳定的 WorldTick。Pause 只暂停 gameplay，不暂停表现层。
 */
export class WorldClock {
  readonly hz: number;
  readonly stepMs: number;
  private accumulatorMs = 0;
  private nextTickValue = 0;
  private pausedValue = false;

  constructor(hz = DEFAULT_WORLD_HZ) {
    this.hz = Number.isFinite(hz) && hz > 0 ? hz : DEFAULT_WORLD_HZ;
    this.stepMs = 1000 / this.hz;
  }

  get nextTick(): WorldTick {
    return { tick: this.nextTickValue, stepMs: this.stepMs };
  }

  get tickCount(): number {
    return this.nextTickValue;
  }

  get paused(): boolean {
    return this.pausedValue;
  }

  /**
   * 吸收真实时间并执行 0..N 个固定 gameplay Tick。单次最多追赶 4 Tick；
   * 超出的后台停顿直接丢弃，避免恢复页面时形成更新风暴。
   */
  advance(deltaMs: number, listener: WorldTickListener): number {
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

  pause(): void {
    this.pausedValue = true;
    this.accumulatorMs = 0;
  }

  resume(): void {
    this.pausedValue = false;
    this.accumulatorMs = 0;
  }

  /** Debug 单步只允许在暂停状态推进，避免与 RAF 驱动的 advance() 交错。 */
  step(count: number, listener: WorldTickListener): number {
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

  private runTick(listener: WorldTickListener): void {
    const time = this.nextTick;
    this.nextTickValue += 1;
    listener(time);
  }
}
