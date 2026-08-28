import { DEFAULT_PRESENTATION_HZ } from "./EngineTiming.js";

export interface PresentationFrame {
  /** 表现层帧序号，与 World tick 无关。 */
  frame: number;
  /** 当前采样使用的 RAF 时间戳，单位 ms。 */
  nowMs: number;
  /** 距上一个表现帧的真实时间，单位 ms。 */
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
  private lastSampleMs: number | null = null;

  constructor(hz = DEFAULT_PRESENTATION_HZ) {
    this.hz = Number.isFinite(hz) && hz > 0 ? hz : DEFAULT_PRESENTATION_HZ;
    this.stepMs = 1000 / this.hz;
  }

  get current(): PresentationFrame {
    return { ...this.currentValue };
  }

  /** 达到采样间隔时产出一个表现帧；返回 null 表示本次 RAF 不需要重绘。 */
  advance(timestampMs: number): PresentationFrame | null {
    if (!Number.isFinite(timestampMs) || timestampMs < 0) return null;
    if (this.lastSampleMs === null) {
      this.lastSampleMs = timestampMs;
      this.currentValue = { frame: 0, nowMs: timestampMs, deltaMs: 0 };
      return this.current;
    }

    const deltaMs = Math.max(0, timestampMs - this.lastSampleMs);
    if (deltaMs + 0.01 < this.stepMs) return null;
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
    this.lastSampleMs = null;
  }
}
