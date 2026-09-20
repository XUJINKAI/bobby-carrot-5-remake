import type { Game, InputController } from "@bobby/engine";

export type GameplayGateReason =
  | "blocking-interaction"
  | "shell-dialog"
  | "play-result";

export interface GameplayGateLease {
  release(): void;
}

/** Web 持有页面级阻塞原因；Engine 只接收合成后的 pause/input 状态。 */
export class GameplayGateManager {
  private readonly leases = new Map<symbol, ReturnType<InputController["acquireBlock"]>>();

  constructor(
    private readonly game: Game,
    private readonly input: InputController,
  ) {}

  acquire(reason: GameplayGateReason): GameplayGateLease {
    const token = Symbol(reason);
    const inputLease = this.input.acquireBlock(reason);
    this.leases.set(token, inputLease);
    this.game.setHostGameplayPaused(true);
    if (reason === "blocking-interaction") this.game.abortReplayRecording();
    let active = true;
    return {
      release: () => {
        if (!active) return;
        active = false;
        this.leases.get(token)?.release();
        this.leases.delete(token);
        if (this.leases.size === 0) this.game.setHostGameplayPaused(false);
      },
    };
  }

  destroy(): void {
    for (const lease of this.leases.values()) lease.release();
    this.leases.clear();
    this.game.setHostGameplayPaused(false);
  }
}
