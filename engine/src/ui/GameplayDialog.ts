import type { Game } from "../core/Game.js";
import { resolveGameplayMount } from "./gameplayMount.js";

export interface GameplayDialogOptions {
  root?: HTMLElement;
}

export interface GameplayDialogChoiceOptions {
  message: string;
  leftLabel: string;
  rightLabel: string;
  primary?: "left" | "right";
}

export type GameplayDialogChoice = "left" | "right" | "dismissed";

/**
 * Engine 持有的地图内对话层。World 只发最终文本；该层负责展示以及随玩家移动结束对话。
 */
export class GameplayDialog {
  readonly root: HTMLDivElement;
  private readonly text: HTMLDivElement;
  private readonly actions: HTMLDivElement;
  private readonly unsubscribes: (() => void)[];
  private pendingChoice: {
    resolve: (choice: GameplayDialogChoice) => void;
  } | null = null;

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
    this.actions = document.createElement("div");
    this.actions.className = "engine-gameplay-dialog-actions";
    Object.assign(this.actions.style, {
      display: "none",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
      marginTop: "12px",
    });
    panel.append(this.text, this.actions);
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
    this.settleChoice("dismissed");
    this.preparePassiveView();
    this.text.textContent = message;
    this.root.hidden = false;
  }

  /** 展示一个通用双选项对话，只返回选择结果，不执行宿主业务。 */
  choose(options: GameplayDialogChoiceOptions): Promise<GameplayDialogChoice> {
    this.settleChoice("dismissed");
    this.root.setAttribute("role", "dialog");
    this.root.setAttribute("aria-live", "off");
    this.root.style.pointerEvents = "auto";
    this.text.textContent = options.message;
    this.actions.style.display = "grid";
    this.actions.replaceChildren(
      this.choiceButton("left", options.leftLabel, options.primary === "left"),
      this.choiceButton("right", options.rightLabel, options.primary === "right"),
    );
    this.root.hidden = false;
    return new Promise((resolve) => {
      this.pendingChoice = { resolve };
    });
  }

  close(): void {
    this.settleChoice("dismissed");
    if (this.root.hidden) return;
    this.hide();
  }

  private choiceButton(
    choice: Exclude<GameplayDialogChoice, "dismissed">,
    label: string,
    primary: boolean,
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.tabIndex = -1;
    button.textContent = label;
    button.dataset.choice = choice;
    Object.assign(button.style, {
      minHeight: "38px",
      border: primary
        ? "1px solid rgba(178,255,203,.72)"
        : "1px solid rgba(255,255,255,.24)",
      borderRadius: "9px",
      background: primary
        ? "rgba(38,126,70,.92)"
        : "rgba(255,255,255,.08)",
      color: "inherit",
      font: "inherit",
      cursor: "pointer",
    });
    button.addEventListener("click", () => this.settleChoice(choice));
    return button;
  }

  private settleChoice(choice: GameplayDialogChoice): void {
    const pending = this.pendingChoice;
    if (!pending) return;
    this.pendingChoice = null;
    this.hide();
    pending.resolve(choice);
  }

  private preparePassiveView(): void {
    this.root.setAttribute("role", "status");
    this.root.setAttribute("aria-live", "polite");
    this.root.style.pointerEvents = "none";
    this.actions.style.display = "none";
    this.actions.replaceChildren();
  }

  private hide(): void {
    this.root.hidden = true;
    this.text.textContent = "";
    this.preparePassiveView();
  }

  destroy(): void {
    this.close();
    for (const unsubscribe of this.unsubscribes) unsubscribe();
    this.root.remove();
  }
}
