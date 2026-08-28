import type { Direction } from "@bobby/model";

export type ContinuousInputSource = "keyboard" | "joystick" | "external";

export interface HeldDirectionInput {
  source: ContinuousInputSource;
  direction: Direction;
  initialRepeatDelayMs: number;
}

export type HeldMoveAttempt = "moved" | "blocked" | "busy";

/**
 * 持续方向输入的统一 repeat 状态机。
 *
 * 输入源只声明“当前持续按住哪个方向”；真正的移动只在 update() 中产生，
 * 便于之后由 Engine 世界时钟统一驱动。第一次移动立即尝试，第二次移动前
 * 等待 initialRepeatDelayMs；进入 repeat 后由 Game 自身的动画忙状态限制步频。
 */
export class HeldDirectionRepeater {
  private input: HeldDirectionInput | null = null;
  private initialMoveDone = false;
  private elapsedAfterInitialMoveMs = 0;
  private blocked = false;

  setInput(input: HeldDirectionInput | null): void {
    const normalized = input
      ? {
          ...input,
          initialRepeatDelayMs: Math.max(0, input.initialRepeatDelayMs),
        }
      : null;
    if (
      this.input?.source === normalized?.source &&
      this.input?.direction === normalized?.direction &&
      this.input?.initialRepeatDelayMs === normalized?.initialRepeatDelayMs
    )
      return;

    this.input = normalized;
    this.initialMoveDone = false;
    this.elapsedAfterInitialMoveMs = 0;
    this.blocked = false;
  }

  reset(): void {
    this.setInput(null);
  }

  update(
    deltaMs: number,
    attemptMove: (direction: Direction) => HeldMoveAttempt,
  ): void {
    if (!this.input || this.blocked) return;

    if (!this.initialMoveDone) {
      const result = attemptMove(this.input.direction);
      if (result === "busy") return;
      if (result === "blocked") {
        this.blocked = true;
        return;
      }
      this.initialMoveDone = true;
      this.elapsedAfterInitialMoveMs = 0;
      return;
    }

    this.elapsedAfterInitialMoveMs += Math.max(0, deltaMs);
    if (
      this.elapsedAfterInitialMoveMs < this.input.initialRepeatDelayMs
    )
      return;

    const result = attemptMove(this.input.direction);
    if (result === "blocked") this.blocked = true;
  }
}
