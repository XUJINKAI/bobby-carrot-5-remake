import type { Game } from "../core/Game.js";
import { resolveGameplayMount } from "./gameplayMount.js";

export interface GameplayDialogOptions {
  root?: HTMLElement;
}

/**
 * Engine 持有的地图内对话层。World 只发最终文本；该层负责展示以及随玩家移动结束对话。
 */
export class GameplayDialog {
  readonly root: HTMLDivElement;
  private readonly text: HTMLDivElement;
  private readonly unsubscribes: (() => void)[];

  constructor(
    private readonly game: Game,
    canvas: HTMLCanvasElement,
    options: GameplayDialogOptions = {},
  ) {
    const mount = resolveGameplayMount(canvas, options.root, "GameplayDialog");
    this.root = document.createElement("div");
    this.root.className = "engine-gameplay-dialog";
    this.root.hidden = true;
    this.root.setAttribute("role", "status");
    this.root.setAttribute("aria-live", "polite");
    Object.assign(this.root.style, {
      position: "absolute",
      left: "50%",
      bottom: "18px",
      zIndex: "7",
      width: "min(560px, calc(100% - 32px))",
      transform: "translateX(-50%)",
      pointerEvents: "none",
      color: "#f7fbff",
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      lineHeight: "1.55",
    });

    const panel = document.createElement("div");
    panel.className = "engine-gameplay-dialog-panel";
    Object.assign(panel.style, {
      padding: "13px 16px",
      border: "1px solid rgba(255,255,255,.2)",
      borderRadius: "12px",
      background: "rgba(8,14,22,.9)",
      boxShadow: "0 12px 36px rgba(0,0,0,.42)",
      backdropFilter: "blur(8px)",
    });
    this.text = document.createElement("div");
    this.text.className = "engine-gameplay-dialog-text";
    panel.append(this.text);
    this.root.append(panel);
    mount.append(this.root);

    this.unsubscribes = [
      game.onWorldEvent((event) => {
        if (event.type === "dialog" && typeof event.text === "string")
          this.show(event.text);
      }),
      game.on("move", () => {
        const openedByThisMove = game.lastWorldEvents.some(
          (event) => event.type === "dialog",
        );
        if (!openedByThisMove) this.close();
      }),
      game.on("change", () => {
        if (game.lastMove === null) this.close();
      }),
      game.on("level-loaded", () => this.close()),
      game.on("death", () => this.close()),
      game.on("level-complete", () => this.close()),
    ];
  }

  get open(): boolean {
    return !this.root.hidden;
  }

  show(message: string): void {
    this.text.textContent = message;
    this.root.hidden = false;
  }

  close(): void {
    if (this.root.hidden) return;
    this.root.hidden = true;
    this.text.textContent = "";
  }

  destroy(): void {
    for (const unsubscribe of this.unsubscribes) unsubscribe();
    this.root.remove();
  }
}
