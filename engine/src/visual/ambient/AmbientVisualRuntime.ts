import type { PresentationFrame } from "../../time/PresentationClock.js";
import type { AmbientVisualState } from "../VisualDefinition.js";

const BONUS_COIN_FRAME_MS = 124;
const BONUS_COIN_SPARKLE_FRAMES = 3;
const BONUS_COIN_GATE_DIVISOR = 8;
const DEFAULT_AMBIENT_SEED = 0x5b0bb7;

/** 同一表现会话内共享的环境动画状态；不进入 World、Snapshot 或 Replay。 */
export class AmbientVisualRuntime {
  private readonly seed: number;
  private originMs: number | null = null;
  private lastBonusCoinSlot = -1;
  private bonusCoinFrame: number | null = null;

  constructor(seed = DEFAULT_AMBIENT_SEED) {
    this.seed = Number.isFinite(seed) ? Math.trunc(seed) : DEFAULT_AMBIENT_SEED;
  }

  get state(): AmbientVisualState {
    return { bonusCoinSparkleFrame: this.bonusCoinFrame };
  }

  update(frame: PresentationFrame): void {
    if (this.originMs === null) this.originMs = frame.nowMs;
    const elapsedMs = Math.max(0, frame.nowMs - this.originMs);
    const targetSlot = Math.floor(elapsedMs / BONUS_COIN_FRAME_MS);
    if (targetSlot < this.lastBonusCoinSlot) {
      this.lastBonusCoinSlot = -1;
      this.bonusCoinFrame = null;
    }
    for (let slot = this.lastBonusCoinSlot + 1; slot <= targetSlot; slot += 1) {
      this.advanceBonusCoin(slot);
    }
    this.lastBonusCoinSlot = targetSlot;
  }

  clear(): void {
    this.originMs = null;
    this.lastBonusCoinSlot = -1;
    this.bonusCoinFrame = null;
  }

  private advanceBonusCoin(slot: number): void {
    if (this.bonusCoinFrame !== null) {
      this.bonusCoinFrame =
        this.bonusCoinFrame + 1 < BONUS_COIN_SPARKLE_FRAMES
          ? this.bonusCoinFrame + 1
          : null;
      return;
    }
    if (deterministicGate(this.seed, slot, BONUS_COIN_GATE_DIVISOR)) {
      this.bonusCoinFrame = 0;
    }
  }
}

function deterministicGate(seed: number, slot: number, divisor: number): boolean {
  let value = (seed ^ Math.imul(slot + 1, 0x9e3779b1)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  return value % divisor === 0;
}
