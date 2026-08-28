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
 * 输入事件只更新 held state；真正的移动只在 update() 中产生，便于之后由
 * Engine 世界时钟统一驱动。首次方向 edge 会被缓冲到下一次 update()，因此
 * 即使用户在一个 tick 内完成按下/松开，也不会丢掉这次单格输入。
 */
export class HeldDirectionRepeater {
  private heldInput: HeldDirectionInput | null = null;
  private pendingInitialInput: HeldDirectionInput | null = null;
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
    if (this.sameInput(this.heldInput, normalized)) return;

    this.heldInput = normalized;
    this.initialMoveDone = false;
    this.elapsedAfterInitialMoveMs = 0;
    this.blocked = false;
    if (normalized) this.pendingInitialInput = normalized;
  }

  reset(): void {
    this.heldInput = null;
    this.pendingInitialInput = null;
    this.initialMoveDone = false;
    this.elapsedAfterInitialMoveMs = 0;
    this.blocked = false;
  }

  update(
    deltaMs: number,
    attemptMove: (direction: Direction) => HeldMoveAttempt,
  ): void {
    if (this.pendingInitialInput) {
      const pending = this.pendingInitialInput;
      const result = attemptMove(pending.direction);
      if (result === "busy") return;

      this.pendingInitialInput = null;
      if (result === "blocked") {
        if (this.sameInput(this.heldInput, pending)) this.blocked = true;
        return;
      }

      if (this.sameInput(this.heldInput, pending)) {
        this.initialMoveDone = true;
        this.elapsedAfterInitialMoveMs = 0;
      }
      return;
    }

    if (!this.heldInput || !this.initialMoveDone || this.blocked) return;

    this.elapsedAfterInitialMoveMs += Math.max(0, deltaMs);
    if (
      this.elapsedAfterInitialMoveMs < this.heldInput.initialRepeatDelayMs
    )
      return;

    const result = attemptMove(this.heldInput.direction);
    if (result === "blocked") this.blocked = true;
  }

  private sameInput(
    a: HeldDirectionInput | null,
    b: HeldDirectionInput | null,
  ): boolean {
    return (
      a?.source === b?.source &&
      a?.direction === b?.direction &&
      a?.initialRepeatDelayMs === b?.initialRepeatDelayMs
    );
  }
}
