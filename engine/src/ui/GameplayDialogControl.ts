import type { GameplayEffectIntent } from "../world/movement/WorldIntent.js";

export interface GameplayDialogControlOptions {
  discardPendingInput(): void;
  onBlockingChoice(): void;
  dispatchEffect(intent: GameplayEffectIntent): void;
}

/** 协调阻塞对话与 World 推进。 */
export class GameplayDialogControl {
  private pausedValue = false;

  constructor(private readonly options: GameplayDialogControlOptions) {}

  get worldPaused(): boolean {
    return this.pausedValue;
  }

  setWorldPaused(value: boolean): void {
    this.pausedValue = value;
    if (value) this.options.discardPendingInput();
  }

  beginBlockingChoice(): void {
    this.options.onBlockingChoice();
  }

  dispatchEffect(intent: GameplayEffectIntent): void {
    this.options.dispatchEffect(intent);
  }
}
