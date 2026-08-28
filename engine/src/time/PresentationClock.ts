import { DEFAULT_PRESENTATION_HZ } from "./EngineTiming.js";

export interface PresentationFrame {
  /** 表现层帧序号，与 World tick 无关。 */
  frame: number;
  /** 当前表现时间，单位 ms。 */
  nowMs: number;
  /** 距上一个表现采样的时间；Debug 倒帧时可以为负数。 */
  deltaMs: number;
}

/**
 * RAF 只负责喂入真实时间；PresentationClock 自己维护可暂停、可单帧前后移动的表现时间线。
 * presentationHz 只改变采样粒度，不改变动画持续时间。
 */
export class PresentationClock {
  readonly hz: number;
  readonly stepMs: number;
  private currentValue: PresentationFrame = { frame: 0, nowMs: 0, deltaMs: 0 };
  private virtualNowMs = 0;
  private originNowMs = 0;
  private lastTimestampMs: number | null = null;
  private accumulatorMs = 0;
  private pausedValue = false;

  constructor(hz = DEFAULT_PRESENTATION_HZ) {
    this.hz = Number.isFinite(hz) && hz > 0 ? hz : DEFAULT_PRESENTATION_HZ;
    this.stepMs = 1000 / this.hz;
  }

  get paused(): boolean {
    return this.pausedValue;
  }

  /** 未到下一采样点时 nowMs 也继续前进，保证新 Tween 从真实表现时间开始。 */
  get current(): PresentationFrame {
    return { ...this.currentValue, nowMs: this.virtualNowMs };
  }

  pause(): void {
    this.pausedValue = true;
  }

  resume(): void {
    this.pausedValue = false;
  }

  /**
   * Debug 单帧控制。只在暂停状态生效；允许负数以检查最近的纯表现过渡。
   * 返回实际落到的 PresentationFrame，越过 frame 0 的部分会被裁掉。
   */
  step(frames: number): PresentationFrame | null {
    if (!this.pausedValue || !Number.isFinite(frames)) return null;
    const requested = Math.trunc(frames);
    if (requested === 0) return this.current;
    const applied = Math.max(-this.currentValue.frame, requested);
    if (applied === 0) return this.current;
    this.virtualNowMs = Math.max(
      this.originNowMs,
      this.virtualNowMs + applied * this.stepMs,
    );
    this.currentValue = {
      frame: this.currentValue.frame + applied,
      nowMs: this.virtualNowMs,
      deltaMs: applied * this.stepMs,
    };
    this.accumulatorMs = 0;
    return this.current;
  }

  /** 达到采样相位时产出一个表现帧；暂停或尚未到相位时返回 null。 */
  advance(timestampMs: number): PresentationFrame | null {
    if (!Number.isFinite(timestampMs) || timestampMs < 0) return null;
    if (this.lastTimestampMs === null) {
      this.lastTimestampMs = timestampMs;
      this.originNowMs = timestampMs;
      this.virtualNowMs = timestampMs;
      this.currentValue = { frame: 0, nowMs: timestampMs, deltaMs: 0 };
      return this.pausedValue ? null : this.current;
    }

    const deltaMs = Math.max(0, timestampMs - this.lastTimestampMs);
    this.lastTimestampMs = timestampMs;
    if (this.pausedValue) return null;

    this.virtualNowMs += deltaMs;
    this.accumulatorMs += deltaMs;
    if (this.accumulatorMs + 0.01 < this.stepMs) return null;

    const intervals = Math.max(
      1,
      Math.floor((this.accumulatorMs + 0.01) / this.stepMs),
    );
    this.accumulatorMs -= intervals * this.stepMs;
    const sampledDeltaMs = this.virtualNowMs - this.currentValue.nowMs;
    this.currentValue = {
      frame: this.currentValue.frame + intervals,
      nowMs: this.virtualNowMs,
      deltaMs: sampledDeltaMs,
    };
    return this.current;
  }

  reset(): void {
    this.currentValue = { frame: 0, nowMs: 0, deltaMs: 0 };
    this.virtualNowMs = 0;
    this.originNowMs = 0;
    this.lastTimestampMs = null;
    this.accumulatorMs = 0;
    this.pausedValue = false;
  }
}
