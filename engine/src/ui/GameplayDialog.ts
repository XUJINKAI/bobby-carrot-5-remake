import type { Game } from "../core/Game.js";
import { resolveGameplayMount } from "./gameplayMount.js";

export interface GameplayDialogOptions {
  root?: HTMLElement;
  /** 每个 Unicode 字符的展示间隔；设为 0 时立即显示全文。 */
  characterIntervalMs?: number;
}

export interface GameplayDialogOption {
  id: string;
  label: string;
  primary?: boolean;
}

export interface GameplayDialogPresentation {
  message: string;
  options?: readonly GameplayDialogOption[];
}

export type GameplayDialogResult =
  | { type: "selected"; optionId: string }
  | { type: "dismissed" };

interface GameplayDialogInput {
  readonly isEnabled: boolean;
  setEnabled(value: boolean): void;
}

const DEFAULT_CHARACTER_INTERVAL_MS = 28;

/**
 * Engine 持有的地图内对话层。World 只发最终文本；该层负责展示以及随玩家移动结束对话。
 */
export class GameplayDialog {
  readonly root: HTMLDivElement;
  private readonly text: HTMLDivElement;
  private readonly actions: HTMLDivElement;
  private readonly unsubscribes: (() => void)[];
  private readonly characterIntervalMs: number;
  private pendingPresentation: {
    resolve: (result: GameplayDialogResult) => void;
  } | null = null;
  private optionButtons: HTMLButtonElement[] = [];
  private optionIds: string[] = [];
  private selectedOptionIndex = -1;
  private typingTimer: number | null = null;
  private typingCharacters: string[] = [];
  private typingIndex = 0;
  private finishTypingCallback: (() => void) | null = null;
  private inputEnabledBeforePresentation: boolean | null = null;
  private openedDuringCurrentDispatch = false;

  constructor(
    private readonly game: Game,
    canvas: HTMLCanvasElement,
    options: GameplayDialogOptions = {},
    private readonly input: GameplayDialogInput | null = null,
  ) {
    const mount = resolveGameplayMount(canvas, options.root, "GameplayDialog");
    this.characterIntervalMs = resolveCharacterInterval(
      options.characterIntervalMs,
    );
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
      maxHeight: "min(42vh, 260px)",
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
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      maxHeight: "min(42vh, 260px)",
      padding: "13px 16px",
      border: "1px solid rgba(255,255,255,.2)",
      borderRadius: "12px",
      background: "rgba(8,14,22,.72)",
      boxShadow: "0 12px 36px rgba(0,0,0,.42)",
      backdropFilter: "blur(10px)",
    });
    this.text = document.createElement("div");
    this.text.className = "engine-gameplay-dialog-text";
    Object.assign(this.text.style, {
      minHeight: "1.55em",
      overflowY: "auto",
      overscrollBehavior: "contain",
      whiteSpace: "pre-wrap",
    });
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
    window.addEventListener("keydown", this.onKeyDown, true);

    this.unsubscribes = [
      game.onWorldEvent((event) => {
        if (event.type === "dialog" && typeof event.text === "string")
          this.show(event.text);
      }),
      game.on("move", () => {
        if (this.openedDuringCurrentDispatch) return;
        const openedByThisMove = game.lastWorldEvents.some(
          (event) => event.type === "dialog",
        );
        if (!openedByThisMove) this.close();
      }),
      game.on("change", () => {
        if (game.lastMove === null && game.lastWorldEvents.length === 0)
          this.close();
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
    this.settlePresentation({ type: "dismissed" });
    this.protectFromCurrentDispatch();
    this.preparePassiveView();
    this.root.hidden = false;
    this.typeMessage(message);
  }

  /** 展示零到多个通用选项，只返回选项 ID，不执行宿主业务。 */
  present(
    presentation: GameplayDialogPresentation,
  ): Promise<GameplayDialogResult> {
    this.settlePresentation({ type: "dismissed" });
    this.protectFromCurrentDispatch();
    const options = presentation.options ?? [];
    this.preparePassiveView();
    this.root.hidden = false;
    return new Promise((resolve) => {
      this.pendingPresentation = { resolve };
      if (options.length > 0) this.prepareInteractiveView(options);
      this.typeMessage(presentation.message, () => this.revealOptions());
    });
  }

  close(): void {
    this.settlePresentation({ type: "dismissed" });
    if (this.root.hidden) return;
    this.hide();
  }

  private optionButton(option: GameplayDialogOption): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.tabIndex = -1;
    button.textContent = option.label;
    button.dataset.dialogOption = option.id;
    Object.assign(button.style, {
      minHeight: "38px",
      border: "1px solid rgba(255,255,255,.24)",
      borderRadius: "9px",
      background: "rgba(255,255,255,.08)",
      color: "inherit",
      font: "inherit",
      cursor: "pointer",
      transition:
        "background 120ms ease, border-color 120ms ease, transform 120ms ease",
    });
    button.addEventListener("click", () =>
      this.settlePresentation({ type: "selected", optionId: option.id })
    );
    return button;
  }

  private settlePresentation(result: GameplayDialogResult): void {
    const pending = this.pendingPresentation;
    if (!pending) return;
    this.pendingPresentation = null;
    this.hide();
    pending.resolve(result);
  }

  private preparePassiveView(): void {
    this.root.setAttribute("role", "status");
    this.root.setAttribute("aria-live", "polite");
    this.root.style.pointerEvents = "none";
    this.actions.style.display = "none";
    this.actions.replaceChildren();
    this.optionButtons = [];
    this.optionIds = [];
    this.selectedOptionIndex = -1;
  }

  private prepareInteractiveView(
    options: readonly GameplayDialogOption[],
  ): void {
    this.root.setAttribute("role", "dialog");
    this.root.setAttribute("aria-live", "off");
    this.root.style.pointerEvents = "auto";
    this.optionIds = options.map((option) => option.id);
    this.optionButtons = options.map((option) => this.optionButton(option));
    const primaryIndex = options.findIndex((option) => option.primary);
    this.selectedOptionIndex = primaryIndex >= 0 ? primaryIndex : 0;
    this.suspendGameplayInput();
  }

  private revealOptions(): void {
    if (this.optionButtons.length === 0) return;
    this.actions.style.display = "grid";
    this.actions.style.gridTemplateColumns =
      "repeat(auto-fit, minmax(96px, 1fr))";
    this.actions.replaceChildren(...this.optionButtons);
    this.renderOptionSelection();
  }

  private selectRelative(offset: number): void {
    if (this.optionButtons.length === 0) return;
    this.selectedOptionIndex = cycleOptionIndex(
      this.selectedOptionIndex,
      this.optionButtons.length,
      offset,
    );
    this.renderOptionSelection();
  }

  private renderOptionSelection(): void {
    for (const [index, button] of this.optionButtons.entries()) {
      const selected = index === this.selectedOptionIndex;
      button.dataset.selected = String(selected);
      button.setAttribute("aria-pressed", String(selected));
      button.style.borderColor = selected
        ? "rgba(255,255,255,.96)"
        : "rgba(255,255,255,.24)";
      button.style.background = selected
        ? "rgba(255,255,255,.3)"
        : "rgba(255,255,255,.08)";
      button.style.boxShadow = selected
        ? "0 0 0 2px rgba(255,255,255,.24), 0 4px 14px rgba(0,0,0,.28)"
        : "none";
      button.style.transform = selected ? "translateY(-1px)" : "none";
    }
  }

  private typeMessage(message: string, onFinished?: () => void): void {
    this.cancelTyping();
    this.text.textContent = "";
    this.text.setAttribute("aria-label", message);
    this.typingCharacters = Array.from(message);
    this.typingIndex = 0;
    this.finishTypingCallback = onFinished ?? null;
    if (this.characterIntervalMs === 0 || this.typingCharacters.length === 0) {
      this.finishTyping();
      return;
    }
    this.text.dataset.typing = "true";
    this.appendNextCharacter();
  }

  private appendNextCharacter(): void {
    this.text.textContent += this.typingCharacters[this.typingIndex] ?? "";
    this.typingIndex += 1;
    if (this.typingIndex >= this.typingCharacters.length) {
      this.finishTyping();
      return;
    }
    this.typingTimer = window.setTimeout(
      () => this.appendNextCharacter(),
      this.characterIntervalMs,
    );
  }

  private finishTyping(): void {
    if (this.typingTimer !== null) window.clearTimeout(this.typingTimer);
    this.typingTimer = null;
    this.text.textContent = this.typingCharacters.join("");
    delete this.text.dataset.typing;
    const callback = this.finishTypingCallback;
    this.finishTypingCallback = null;
    callback?.();
  }

  private cancelTyping(): void {
    if (this.typingTimer !== null) window.clearTimeout(this.typingTimer);
    this.typingTimer = null;
    this.typingCharacters = [];
    this.typingIndex = 0;
    this.finishTypingCallback = null;
    delete this.text.dataset.typing;
  }

  private suspendGameplayInput(): void {
    if (!this.input || this.inputEnabledBeforePresentation !== null) return;
    this.inputEnabledBeforePresentation = this.input.isEnabled;
    this.input.setEnabled(false);
  }

  private restoreGameplayInput(): void {
    if (!this.input || this.inputEnabledBeforePresentation === null) return;
    const enabled = this.inputEnabledBeforePresentation;
    this.inputEnabledBeforePresentation = null;
    this.input.setEnabled(enabled);
  }

  private protectFromCurrentDispatch(): void {
    this.openedDuringCurrentDispatch = true;
    queueMicrotask(() => {
      this.openedDuringCurrentDispatch = false;
    });
  }

  private hide(): void {
    this.cancelTyping();
    this.restoreGameplayInput();
    this.root.hidden = true;
    this.text.textContent = "";
    this.text.removeAttribute("aria-label");
    this.preparePassiveView();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      this.root.hidden ||
      !this.pendingPresentation ||
      this.optionIds.length === 0 ||
      !["ArrowLeft", "ArrowRight", "Enter"].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (this.typingTimer !== null) {
      if (event.key === "Enter" && !event.repeat) this.finishTyping();
      return;
    }
    if (event.key === "ArrowLeft") this.selectRelative(-1);
    else if (event.key === "ArrowRight") this.selectRelative(1);
    else if (!event.repeat) {
      const optionId = this.optionIds[this.selectedOptionIndex];
      if (optionId !== undefined) {
        this.settlePresentation({ type: "selected", optionId });
      }
    }
  };

  destroy(): void {
    this.close();
    window.removeEventListener("keydown", this.onKeyDown, true);
    for (const unsubscribe of this.unsubscribes) unsubscribe();
    this.root.remove();
  }
}

function resolveCharacterInterval(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : DEFAULT_CHARACTER_INTERVAL_MS;
}

export function cycleOptionIndex(
  current: number,
  count: number,
  offset: number,
): number {
  if (count < 1) return -1;
  return ((current + offset) % count + count) % count;
}
