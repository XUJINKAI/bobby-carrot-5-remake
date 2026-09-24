export type KeyboardRange =
  | { mode: "global" }
  | { mode: "focus"; root: HTMLElement };

/** 宿主声明有序层；同层作用域后激活者优先，模态作用域独占输入。 */
export interface KeyboardScopeOptions {
  layer?: string;
  range?: KeyboardRange;
  active?: boolean;
  modal?: boolean;
  repeat?: boolean;
  repeatIntervalMs?: number;
  /** 仅保留自身 keydown 回调同步移动焦点时的按键，其它焦点变化仍取消输入。 */
  retainOnFocusChange?: boolean;
  modifiers?: "none" | "any";
  editable?: boolean;
  keydown(event: KeyboardEvent): boolean;
  keyup?(event: KeyboardEvent): void;
  cancel?(): void;
  blur?(): void;
}

export interface KeyboardScope {
  setActive(active: boolean): void;
  setModal(modal: boolean): void;
  dispose(): void;
}

interface ScopeEntry {
  options: KeyboardScopeOptions;
  active: boolean;
  modal: boolean;
  order: number;
}

interface PressedKey {
  owner: ScopeEntry | null;
  cancelled: boolean;
  handled: boolean;
  lastDispatchAt: number;
}

export interface KeyboardRuntimeOptions {
  target?: Window;
  range?: KeyboardRange;
  /** 从高到低排列；省略 layer 的消费者注册到最后一层。 */
  layers?: readonly string[];
}

export function isKeyboardEditableTarget(target: EventTarget | null): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) return false;
  if (target.closest("input, textarea, select")) return true;
  const editable = target.closest("[contenteditable]");
  return editable !== null && editable.getAttribute("contenteditable") !== "false";
}

export function hasKeyboardModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
}

/** 浏览器键盘所有权与生命周期；页面含义和游戏动作由消费者声明。 */
export class KeyboardRuntime {
  private readonly target: Window;
  private readonly range: KeyboardRange;
  private readonly layers: readonly string[];
  private readonly scopes = new Set<ScopeEntry>();
  private readonly pressed = new Map<string, PressedKey>();
  private sequence = 0;
  private dispatching: ScopeEntry | null = null;
  private destroyed = false;

  constructor(options: KeyboardRuntimeOptions = {}) {
    this.target = options.target ?? window;
    this.range = options.range ?? { mode: "global" };
    this.layers = options.layers ?? ["default"];
    if (this.layers.length === 0 || new Set(this.layers).size !== this.layers.length)
      throw new Error("KeyboardRuntime layers 必须非空且唯一");
    this.target.addEventListener("keydown", this.onKeyDown, { passive: false });
    this.target.addEventListener("keyup", this.onKeyUp, { passive: false });
    this.target.addEventListener("blur", this.onBlur);
    this.target.addEventListener("focusin", this.onFocusChange);
    this.target.addEventListener("compositionstart", this.onCompositionStart);
  }

  register(options: KeyboardScopeOptions): KeyboardScope {
    if (this.destroyed) throw new Error("KeyboardRuntime 已销毁");
    if (options.layer !== undefined && !this.layers.includes(options.layer))
      throw new Error(`KeyboardRuntime layer 未声明：${options.layer}`);
    const entry: ScopeEntry = {
      options,
      active: options.active ?? true,
      modal: options.modal ?? false,
      order: ++this.sequence,
    };
    if (entry.active) this.cancelPressed();
    this.scopes.add(entry);
    return {
      setActive: (active) => {
        if (!this.scopes.has(entry) || entry.active === active) return;
        this.cancelPressed();
        entry.active = active;
        if (active) entry.order = ++this.sequence;
      },
      setModal: (modal) => {
        if (!this.scopes.has(entry) || entry.modal === modal) return;
        this.cancelPressed();
        entry.modal = modal;
        if (modal) entry.order = ++this.sequence;
      },
      dispose: () => {
        if (!this.scopes.has(entry)) return;
        if (entry.active) this.cancelPressed();
        this.scopes.delete(entry);
        for (const key of this.pressed.values()) {
          if (key.owner === entry) key.owner = null;
        }
      },
    };
  }

  /** 保留物理按下记录直到 keyup，防止重复事件在焦点切换后重新触发动作。 */
  cancelPressed(): void {
    this.cancelKeys();
  }

  private cancelKeys(retained: ScopeEntry | null = null): void {
    const owners = new Set<ScopeEntry>();
    for (const key of this.pressed.values()) {
      if (retained && key.owner === retained) continue;
      key.cancelled = true;
      if (key.owner) owners.add(key.owner);
    }
    for (const owner of owners) owner.options.cancel?.();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.onBlur();
    this.destroyed = true;
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("keyup", this.onKeyUp);
    this.target.removeEventListener("blur", this.onBlur);
    this.target.removeEventListener("focusin", this.onFocusChange);
    this.target.removeEventListener("compositionstart", this.onCompositionStart);
    this.scopes.clear();
  }

  private orderedScopes(): ScopeEntry[] {
    return [...this.scopes].filter((entry) => entry.active).sort((a, b) => {
      if (a.modal !== b.modal) return a.modal ? -1 : 1;
      if (a.modal) return b.order - a.order;
      const rank = (entry: ScopeEntry): number => entry.options.layer === undefined
        ? this.layers.length - 1
        : this.layers.indexOf(entry.options.layer);
      return rank(a) - rank(b) || b.order - a.order;
    });
  }

  private inRange(range: KeyboardRange): boolean {
    if (range.mode === "global") return true;
    const active = range.root.ownerDocument.activeElement;
    return range.root === active || range.root.contains(active) ||
      range.root.matches(":focus-within");
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.isComposing || event.keyCode === 229) return;
    const identity = event.code || event.key.toLowerCase();
    const existing = this.pressed.get(identity);
    if (existing) {
      if (existing.cancelled) {
        event.preventDefault();
      } else if (existing.handled) {
        event.preventDefault();
        const owner = existing.owner;
        if (owner?.options.repeat &&
            event.timeStamp - existing.lastDispatchAt >= (owner.options.repeatIntervalMs ?? 0)) {
          existing.lastDispatchAt = event.timeStamp;
          this.dispatchKeyDown(owner, event);
        }
      }
      return;
    }
    // 失焦后收到的 repeat 没有起始按下事件，不能重新取得输入所有权。
    if (event.repeat) {
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented) return;
    const pressed: PressedKey = {
      owner: null, handled: false, cancelled: false, lastDispatchAt: event.timeStamp,
    };
    this.pressed.set(identity, pressed);
    for (const entry of this.orderedScopes()) {
      const options = entry.options;
      if (!this.inRange(options.range ?? this.range)) continue;
      const accepted = (options.editable || !isKeyboardEditableTarget(event.composedPath?.()[0] ?? event.target)) &&
        (options.modifiers === "any" || !hasKeyboardModifier(event));
      if (accepted) {
        // 回调可能同步打开弹窗或移动焦点，必须先登记原始接收者。
        pressed.owner = entry;
        if (this.dispatchKeyDown(entry, event)) {
          pressed.handled = true;
          event.preventDefault();
          return;
        }
        pressed.owner = null;
      }
      if (pressed.cancelled || entry.modal) return;
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const identity = event.code || event.key.toLowerCase();
    const pressed = this.pressed.get(identity);
    if (!pressed) return;
    this.pressed.delete(identity);
    if (pressed.handled) event.preventDefault();
    pressed.owner?.options.keyup?.(event);
  };

  private dispatchKeyDown(entry: ScopeEntry, event: KeyboardEvent): boolean {
    const previous = this.dispatching;
    this.dispatching = entry;
    try {
      return entry.options.keydown(event);
    } finally {
      this.dispatching = previous;
    }
  }

  private readonly onFocusChange = (): void => {
    this.cancelKeys(this.dispatching?.options.retainOnFocusChange ? this.dispatching : null);
  };

  private readonly onCompositionStart = (): void => {
    this.cancelPressed();
  };

  private readonly onBlur = (): void => {
    // 失焦按作用域统一取消，先清空按键避免持键者被重复通知。
    this.pressed.clear();
    for (const entry of this.scopes) {
      entry.options.cancel?.();
      entry.options.blur?.();
    }
  };
}
