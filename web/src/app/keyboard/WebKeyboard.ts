import { KeyboardRuntime, hasKeyboardModifier, type KeyboardScope } from "@bobby/engine";
import { FocusRegion, isAvailableFocusTarget } from "./FocusRegion.js";
import { MODAL_FOCUS_PLAN, pageFocusPlan, type FocusPlan } from "./focusPlans.js";

export interface KeyboardDialogOptions {
  close(): void;
  initial?: string;
  focus?: FocusPlan;
}

interface ModalRegion {
  focus: FocusRegion;
  scope: KeyboardScope;
}

/** Web 定义产品层顺序与 DOM 焦点，物理按键状态统一交给 Engine。 */
export class WebKeyboard {
  readonly runtime = new KeyboardRuntime({ layers: ["page", "global", "gameplay"] });
  private page: FocusRegion | null = null;
  private readonly modals: ModalRegion[] = [];
  private readonly pageScope: KeyboardScope;
  private readonly arrowScope: KeyboardScope;

  constructor(private readonly root: HTMLElement) {
    this.pageScope = this.runtime.register({
      layer: "page",
      modifiers: "any",
      editable: true,
      keydown: (event) => this.page?.tab(event) ?? false,
    });
    this.arrowScope = this.runtime.register({
      layer: "page",
      repeat: true,
      repeatIntervalMs: 100,
      retainOnFocusChange: true,
      keydown: (event) => this.page?.arrow(event) ?? false,
    });
    root.ownerDocument.documentElement.dataset.keyboardFocus = "false";
    root.ownerDocument.documentElement.dataset.tabFocus = "false";
    root.ownerDocument.addEventListener("keydown", this.observeKeyboardFocus, true);
    root.ownerDocument.addEventListener("pointerdown", this.onPointerDown, true);
    root.ownerDocument.addEventListener("focusin", this.onFocusIn, true);
  }

  setPage(path: string): void {
    this.runtime.cancelPressed();
    const canvas = this.root.querySelector<HTMLElement>("#game, #editor-game");
    const plan = canvas && isAvailableFocusTarget(canvas)
      ? pageFocusPlan("/explore/play/")
      : pageFocusPlan(path);
    const content = this.root.querySelector<HTMLElement>(".app-content") ?? this.root;
    this.page = new FocusRegion(content, plan);
    if (this.modals.length === 0) this.page.focusInitial();
    else this.currentRegion?.refresh();
  }

  refresh(): void {
    this.currentRegion?.refresh();
  }

  matchesTabAction(event: KeyboardEvent, action: string): boolean {
    if (event.key !== "Tab" || event.ctrlKey || event.metaKey || event.altKey || !this.page) return false;
    return this.page.plan.tabAction === action;
  }

  focus(selector: string): void {
    const region = this.currentRegion;
    const target = region?.root.querySelector<HTMLElement>(selector);
    if (target && region?.allows(target)) target.focus();
  }

  openDialog(root: HTMLElement, options: KeyboardDialogOptions): () => void {
    const previous = root.ownerDocument.activeElement;
    const focus = new FocusRegion(root, options.focus ?? MODAL_FOCUS_PLAN);
    const scope = this.runtime.register({
      modal: true,
      modifiers: "any",
      editable: true,
      keydown: (event) => {
        if (focus.tab(event)) return true;
        if (hasKeyboardModifier(event)) return false;
        if (event.key === "Escape") {
          options.close();
          return true;
        }
        return focus.arrow(event);
      },
    });
    const modal = { focus, scope };
    this.modals.push(modal);
    focus.focusInitial(options.initial);
    let closed = false;
    return () => {
      if (closed) return;
      closed = true;
      const wasTop = this.modals.at(-1) === modal;
      this.modals.splice(this.modals.indexOf(modal), 1);
      scope.dispose();
      if (!wasTop) return;
      if (previous instanceof HTMLElement && isAvailableFocusTarget(previous) &&
          this.currentRegion?.allows(previous)) previous.focus({ preventScroll: true });
      else this.currentRegion?.focusInitial();
    };
  }

  destroy(): void {
    this.pageScope.dispose();
    this.arrowScope.dispose();
    for (const modal of this.modals) modal.scope.dispose();
    this.modals.length = 0;
    this.runtime.destroy();
    this.root.ownerDocument.removeEventListener("keydown", this.observeKeyboardFocus, true);
    delete this.root.ownerDocument.documentElement.dataset.keyboardFocus;
    delete this.root.ownerDocument.documentElement.dataset.tabFocus;
    this.root.ownerDocument.removeEventListener("pointerdown", this.onPointerDown, true);
    this.root.ownerDocument.removeEventListener("focusin", this.onFocusIn, true);
  }

  private get currentRegion(): FocusRegion | null {
    return this.modals.at(-1)?.focus ?? this.page;
  }

  /** 只记录交互方式，不处理命令；捕获阶段先于原生焦点和页面动作。 */
  private readonly observeKeyboardFocus = (event: KeyboardEvent): void => {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    // 游戏方向键只操作画布；需要区分 Tab 导航与指针进入后的键盘游玩。
    if (event.key === "Tab")
      this.root.ownerDocument.documentElement.dataset.tabFocus = "true";
    if (["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " "].includes(event.key))
      this.root.ownerDocument.documentElement.dataset.keyboardFocus = "true";
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.root.ownerDocument.documentElement.dataset.keyboardFocus = "false";
    this.root.ownerDocument.documentElement.dataset.tabFocus = "false";
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>("button, a[href], canvas") : null;
    if (!target) return;
    if (this.currentRegion?.allows(target)) {
      target.tabIndex = 0;
      target.focus({ preventScroll: true });
    } else if (target.matches("button")) {
      event.preventDefault();
    }
  };

  private readonly onFocusIn = (event: FocusEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const modal = this.modals.at(-1);
    if (modal && !modal.focus.root.contains(target)) {
      modal.focus.focusInitial();
      return;
    }
    if (target.matches("button") && !this.currentRegion?.allows(target))
      HTMLButtonElement.prototype.blur.call(target);
    else this.currentRegion?.refresh();
  };
}
