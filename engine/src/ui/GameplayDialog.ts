import type { Direction } from "@bobby/model";
import type { LogicalInputAction } from "../input/InputController.js";
import { resolveGameplayMount } from "./gameplayMount.js";

export interface GameplayDialogViewOptions {
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
  options: readonly [GameplayDialogOption, ...GameplayDialogOption[]];
}

export type GameplayDialogOptionResult =
  | { type: "selected"; optionId: string }
  | { type: "dismissed" };

export type GameplayDialogResult =
  | GameplayDialogOptionResult
  | { type: "move"; direction: Direction };

export type GameplayDialogInputAction =
  | "ignore"
  | "finish-typing"
  | "advance"
  | "move"
  | "dismiss"
  | "previous"
  | "next"
  | "select";

const DEFAULT_CHARACTER_INTERVAL_MS = 28;

/** 纯对话 View：调用方持有 World、输入门禁与交互生命周期。 */
export class GameplayDialogView {
  readonly root: HTMLDivElement;
  private readonly text: HTMLDivElement;
  private readonly actions: HTMLDivElement;
  private readonly characterIntervalMs: number;
  private pendingPresentation: {
    resolve: (result: GameplayDialogResult) => void;
  } | null = null;
  private optionButtons: HTMLButtonElement[] = [];
  private optionIds: string[] = [];
  private selectedOptionIndex = -1;
  private passiveMessages: string[] = [];
  private passiveMessageIndex = -1;
  private passiveDirection: Direction | null = null;
  private typingTimer: number | null = null;
  private typingCharacters: string[] = [];
  private typingIndex = 0;
  private finishTypingCallback: (() => void) | null = null;
  private readonly panel: HTMLDivElement;

  constructor(
    canvas: HTMLCanvasElement,
    options: GameplayDialogViewOptions = {},
  ) {
    const mount = resolveGameplayMount(canvas, options.root, "GameplayDialogView");
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
    this.panel = panel;
    panel.addEventListener("click", this.onPanelClick);
    this.root.append(panel);
    mount.append(this.root);
  }

  get open(): boolean {
    return !this.root.hidden;
  }

  /** 展示单段阻塞文本；Enter/点击先完成逐字展示，再结束对话。 */
  show(message: string): Promise<GameplayDialogResult> {
    return this.showSequence([message]);
  }

  /** 在同一 View 生命周期内逐段展示文本，不在段落之间隐藏对话框。 */
  showSequence(
    messages: readonly string[],
    direction: Direction | null = null,
  ): Promise<GameplayDialogResult> {
    if (messages.length === 0)
      throw new Error("GameplayDialogView.showSequence() 至少需要一段文本");
    this.settlePresentation({ type: "dismissed" });
    this.prepareView();
    this.passiveMessages = [...messages];
    this.passiveMessageIndex = 0;
    this.passiveDirection = direction;
    this.root.hidden = false;
    this.typeMessage(this.passiveMessages[0]!);
    return new Promise((resolve) => {
      this.pendingPresentation = { resolve };
    });
  }

  /** 展示一个或多个通用选项，只返回选项 ID，不执行宿主业务。 */
  present(
    presentation: GameplayDialogPresentation,
  ): Promise<GameplayDialogResult> {
    this.settlePresentation({ type: "dismissed" });
    const { options } = presentation;
    if (options.length === 0)
      throw new Error("GameplayDialogView.present() 至少需要一个选项");
    this.prepareView();
    this.root.hidden = false;
    return new Promise((resolve) => {
      this.pendingPresentation = { resolve };
      this.prepareInteractiveView(options);
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

  private prepareView(): void {
    this.root.setAttribute("role", "dialog");
    this.root.setAttribute("aria-live", "off");
    this.root.style.pointerEvents = "auto";
    this.actions.style.display = "none";
    this.actions.replaceChildren();
    this.optionButtons = [];
    this.optionIds = [];
    this.selectedOptionIndex = -1;
    this.passiveMessages = [];
    this.passiveMessageIndex = -1;
    this.passiveDirection = null;
  }

  private prepareInteractiveView(
    options: readonly GameplayDialogOption[],
  ): void {
    this.optionIds = options.map((option) => option.id);
    this.optionButtons = options.map((option) => this.optionButton(option));
    const primaryIndex = options.findIndex((option) => option.primary);
    this.selectedOptionIndex = primaryIndex >= 0 ? primaryIndex : 0;
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

  private hide(): void {
    this.cancelTyping();
    this.root.hidden = true;
    this.text.textContent = "";
    this.text.removeAttribute("aria-label");
    this.prepareView();
  }

  private readonly onPanelClick = (): void => {
    if (!this.pendingPresentation || this.optionIds.length > 0) return;
    if (this.typingTimer !== null) {
      this.finishTyping();
      return;
    }
    this.advancePassiveMessage();
  };

  private advancePassiveMessage(): void {
    const nextIndex = this.passiveMessageIndex + 1;
    const nextMessage = this.passiveMessages[nextIndex];
    if (nextMessage === undefined) {
      this.settlePresentation({ type: "dismissed" });
      return;
    }
    this.passiveMessageIndex = nextIndex;
    this.typeMessage(nextMessage);
  }

  handleInput(input: LogicalInputAction): void {
    if (this.root.hidden || !this.pendingPresentation) return;
    const action = resolveGameplayDialogInputAction(
      input,
      this.optionIds.length,
      this.typingTimer !== null,
      this.passiveDirection,
    );
    if (action === "ignore") return;
    if (action === "dismiss") {
      this.settlePresentation({ type: "dismissed" });
      return;
    }
    if (action === "finish-typing") {
      this.finishTyping();
      return;
    }
    if (action === "advance") {
      this.advancePassiveMessage();
      return;
    }
    if (action === "move") {
      if (input.type === "direction")
        this.settlePresentation({ type: "move", direction: input.direction });
      return;
    }
    if (action === "previous") this.selectRelative(-1);
    else if (action === "next") this.selectRelative(1);
    else if (action === "select") {
      const optionId = this.optionIds[this.selectedOptionIndex];
      if (optionId !== undefined) {
        this.settlePresentation({ type: "selected", optionId });
      }
    }
  }

  destroy(): void {
    this.close();
    this.panel.removeEventListener("click", this.onPanelClick);
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

/** 普通对白按接触方向裁决；输入设备差异已经由 InputController 消除。 */
export function resolveGameplayDialogInputAction(
  input: LogicalInputAction,
  optionCount: number,
  typing: boolean,
  dialogueDirection: Direction | null = null,
): GameplayDialogInputAction {
  if (input.type === "cancel") return "dismiss";
  if (optionCount === 0) {
    if (input.type === "confirm")
      return typing ? "finish-typing" : "advance";
    if (dialogueDirection && input.direction !== dialogueDirection)
      return "move";
    return typing ? "finish-typing" : "advance";
  }
  if (input.type === "confirm") return typing ? "finish-typing" : "select";
  if (typing) return "ignore";
  if (input.direction === "left") return "previous";
  if (input.direction === "right") return "next";
  return "ignore";
}
