import type { Game } from "../core/Game.js";
import type { ImageManager } from "../image/ImageManager.js";
import { resolveGameplayMount } from "./gameplayMount.js";
import { buildGameplayHudModel } from "./GameplayHudModel.js";
import { GameplayHudView } from "./GameplayHudView.js";

export interface GameplayHudOptions {
  enabled?: boolean;
  root?: HTMLElement;
  objective?: boolean;
  inventory?: boolean;
  economy?: boolean;
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
    const signature = JSON.stringify({
      winState,
      profile: state.profile,
      inventory: state.inventory,
      economy: state.economy,
    });
    if (signature === this.lastSignature) return;
    this.lastSignature = signature;
    this.view.render(buildGameplayHudModel(state, winState));
  }

  destroy(): void {
    for (const unsubscribe of this.unsubscribes) unsubscribe();
    this.view.destroy();
  }
}
