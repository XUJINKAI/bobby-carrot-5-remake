import type { Game } from "../core/Game.js";
import type { ImageManager } from "../image/ImageManager.js";
import { resolveGameplayMount } from "./gameplayMount.js";
import { buildGameplayHudModel } from "./GameplayHudModel.js";
import { GameplayHudView } from "./GameplayHudView.js";

export interface GameplayHudOptions {
  enabled?: boolean;
  root?: HTMLElement;
  timer?: boolean;
  steps?: boolean;
  objective?: boolean;
  items?: boolean;
  /** 宿主拥有的全局金币数；函数形式用于读取可变的产品状态。 */
  coins?: number | (() => number);
}

/** Engine HUD owner: subscribes to Game, derives model, delegates DOM to GameplayHudView. */
export class GameplayHud {
  private readonly view: GameplayHudView;
  private readonly unsubscribes: (() => void)[];
  private lastSignature = "";

  constructor(
    private readonly game: Game,
    images: ImageManager,
    canvas: HTMLCanvasElement,
    private readonly options: GameplayHudOptions,
  ) {
    const mount = resolveGameplayMount(canvas, options.root, "GameplayHud");
    this.view = new GameplayHudView(images, options);
    mount.append(this.view.root);
    this.view.root.hidden = options.enabled === false;
    this.unsubscribes = [
      game.on("tick", () => this.render()),
      game.on("change", () => this.render()),
      game.on("level-loaded", () => {
        this.lastSignature = "";
        this.render();
      }),
    ];
    this.render();
  }

  setEnabled(enabled: boolean): void {
    this.view.root.hidden = !enabled;
    if (enabled) this.render();
  }

  render(): void {
    if (!this.game.hasLevel || this.view.root.hidden) return;
    const state = this.game.state;
    const winState = this.game.winState;
    const coins = resolveHudCoins(this.options.coins);
    const signature = JSON.stringify({
      winState,
      moves: state.moves,
      actors: state.actors.map((actor) => ({
        id: actor.id,
        inventory: actor.inventory,
      })),
      primaryActorId: state.primaryActorId,
      coins,
      elapsedSeconds: Math.floor(state.elapsedMs / 1000),
      timedChallengeSeconds:
        state.timedChallengeRemainingMs === null
          ? null
          : Math.ceil(state.timedChallengeRemainingMs / 1000),
      timedChallengePhase: state.timedChallengePhase,
    });
    if (signature === this.lastSignature) return;
    this.lastSignature = signature;
    this.view.render(buildGameplayHudModel(state, winState, coins));
  }

  destroy(): void {
    for (const unsubscribe of this.unsubscribes) unsubscribe();
    this.view.destroy();
  }
}

function resolveHudCoins(
  source: GameplayHudOptions["coins"],
): number | null {
  if (source === undefined) return null;
  const value = typeof source === "function" ? source() : source;
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
