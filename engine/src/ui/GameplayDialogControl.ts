import type { GameplayEffectIntent } from "../world/movement/WorldIntent.js";

export interface GameplayDialogControlOptions {
  discardPendingInput(): void;
  consumeReplayChoice(optionCount: number): number | null;
  recordChoice(tick: number, choice: number): void;
  dispatchEffect(intent: GameplayEffectIntent): void;
}

/** 协调阻塞对话与 World 推进，并把选择绑定到触发它的 Tick。 */
export class GameplayDialogControl {
  private pausedValue = false;
  private currentTick = -1;

  constructor(private readonly options: GameplayDialogControlOptions) {}

  get worldPaused(): boolean {
    return this.pausedValue;
  }

  beginTick(tick: number): void {
    this.currentTick = tick;
  }

  setWorldPaused(value: boolean): void {
    this.pausedValue = value;
    if (value) this.options.discardPendingInput();
  }

  consumeReplayChoice(optionCount: number): number | null {
    return this.options.consumeReplayChoice(optionCount);
  }

  recordChoice(choice: number): void {
    this.options.recordChoice(this.currentTick, choice);
  }

  dispatchEffect(intent: GameplayEffectIntent): void {
    this.options.dispatchEffect(intent);
  }
}
