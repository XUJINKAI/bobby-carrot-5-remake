import type { Direction } from "@bobby/model";

/** Logical input channel. InputController may use arrows/wasd/joystick/external independently. */
export type ContinuousInputSource = string;

export interface HeldDirectionInput {
  source: ContinuousInputSource;
  direction: Direction;
  /** Optional extra delay only between the first and second held move. */
  initialRepeatDelayMs: number;
}

export type HeldMoveAttempt = "moved" | "blocked" | "busy";

type PendingAttempt = {
  input: HeldDirectionInput;
  initial: boolean;
};

/**
 * 持续方向输入的统一 repeat 状态机。
 * 输入事件只更新 held state；update() 只在世界 Tick 上产出一个待尝试方向。
 */
export class HeldDirectionRepeater {
  private heldInput: HeldDirectionInput | null = null;
  private pendingInitialInput: HeldDirectionInput | null = null;
  private pendingAttempt: PendingAttempt | null = null;
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

    // A key/touch pressed and released between two WorldTicks must still produce
    // exactly one move. Releasing after the initial move has been consumed simply
    // stops repetition as usual.
    if (!normalized && this.pendingInitialInput) {
      this.heldInput = null;
      this.blocked = false;
      return;
    }

    this.heldInput = normalized;
    this.pendingAttempt = null;
    this.initialMoveDone = false;
    this.elapsedAfterInitialMoveMs = 0;
    this.blocked = false;
    this.pendingInitialInput = normalized;
  }

  reset(): void {
    this.heldInput = null;
    this.pendingInitialInput = null;
    this.pendingAttempt = null;
    this.initialMoveDone = false;
    this.elapsedAfterInitialMoveMs = 0;
    this.blocked = false;
  }

  update(deltaMs: number): Direction | null {
    if (this.pendingAttempt) return null;

    if (this.pendingInitialInput) {
      this.pendingAttempt = {
        input: this.pendingInitialInput,
        initial: true,
      };
      return this.pendingInitialInput.direction;
    }

    if (!this.heldInput || !this.initialMoveDone || this.blocked) return null;

    this.elapsedAfterInitialMoveMs += Math.max(0, deltaMs);
    if (this.elapsedAfterInitialMoveMs < this.heldInput.initialRepeatDelayMs)
      return null;

    this.pendingAttempt = { input: this.heldInput, initial: false };
    return this.heldInput.direction;
  }

  resolveAttempt(result: HeldMoveAttempt): void {
    const attempt = this.pendingAttempt;
    if (!attempt) return;
    this.pendingAttempt = null;

    if (attempt.initial) {
      if (result === "busy") return;
      this.pendingInitialInput = null;
      if (result === "blocked") {
        if (this.sameInput(this.heldInput, attempt.input)) this.blocked = true;
        return;
      }
      if (this.sameInput(this.heldInput, attempt.input)) {
        this.initialMoveDone = true;
        this.elapsedAfterInitialMoveMs = 0;
      }
      return;
    }

    if (result === "blocked" && this.sameInput(this.heldInput, attempt.input))
      this.blocked = true;
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
