import { DEFAULT_PRESENTATION_HZ } from "./EngineTiming.js";

export interface PresentationFrame {
  /** 表现层帧序号，与 World tick 无关。 */
  frame: number;
  /** 当前表现时间，单位 ms。 */
  nowMs: number;
  /** 距上一个实际表现采样帧的真实时间，单位 ms。 */
  deltaMs: number;
}

/**
 * 由 RAF 驱动的表现时钟。它从不跟随 WorldClock pause；纯视觉动画、Tween、Camera
 * 因此可以在 gameplay 暂停时继续运行。presentationHz 只改变采样频率，不改变时长。
 */
export class PresentationClock {
  readonly hz: number;
  readonly stepMs: number;
  private currentValue: PresentationFrame = { frame: 0, nowMs: 0, deltaMs: 0 };
  private latestNowMs = 0;
  private lastSampleMs: number | null = null;
  private nextSampleMs: number | null = null;

  constructor(hz = DEFAULT_PRESENTATION_HZ) {
    this.hz = Number.isFinite(hz) && hz > 0 ? hz : DEFAULT_PRESENTATION_HZ;
    this.stepMs = 1000 / this.hz;
  }

  /**
   * 当前真实表现时间即使尚未达到下一次采样也会前进。这样新 Tween 的起点不会因为
   * presentationHz 较低而被错误回拨到上一个采样帧。
   */
  get current(): PresentationFrame {
    return { ...this.currentValue, nowMs: this.latestNowMs };
  }

  /** 达到采样相位时产出一个表现帧；返回 null 表示本次 RAF 不需要重绘。 */
  advance(timestampMs: number): PresentationFrame | null {
    if (!Number.isFinite(timestampMs) || timestampMs < 0) return null;
    this.latestNowMs = timestampMs;
    if (this.lastSampleMs === null || this.nextSampleMs === null) {
      this.lastSampleMs = timestampMs;
      this.nextSampleMs = timestampMs + this.stepMs;
      this.currentValue = { frame: 0, nowMs: timestampMs, deltaMs: 0 };
      return this.current;
    }

    if (timestampMs + 0.01 < this.nextSampleMs) return null;
    const intervals =
      Math.floor((timestampMs - this.nextSampleMs) / this.stepMs) + 1;
    this.nextSampleMs += Math.max(1, intervals) * this.stepMs;
    const deltaMs = Math.max(0, timestampMs - this.lastSampleMs);
    this.lastSampleMs = timestampMs;
    this.currentValue = {
      frame: this.currentValue.frame + 1,
      nowMs: timestampMs,
      deltaMs,
    };
    return this.current;
  }

  reset(): void {
    this.currentValue = { frame: 0, nowMs: 0, deltaMs: 0 };
    this.latestNowMs = 0;
    this.lastSampleMs = null;
    this.nextSampleMs = null;
  }
}
