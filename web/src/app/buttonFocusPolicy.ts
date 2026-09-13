export interface ButtonFocusPolicy {
  refresh(): void;
  destroy(): void;
}

/**
 * Web 产品把键盘交给页面快捷键和 Engine，按钮只承担指针触发动作。
 * 表单控件仍保留浏览器原生焦点，避免影响 Editor 与 Settings 的文字输入。
 */
export function installButtonFocusPolicy(root: HTMLElement): ButtonFocusPolicy {
  const ownerDocument = root.ownerDocument;

  const refresh = (): void => {
    for (const button of root.querySelectorAll<HTMLButtonElement>("button")) {
      button.tabIndex = -1;
    }
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Tab") refresh();
  };

  const onPointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (target instanceof Element && target.closest("button")) {
      event.preventDefault();
    }
  };

  const onFocusIn = (event: FocusEvent): void => {
    if (event.target instanceof HTMLButtonElement) {
      HTMLButtonElement.prototype.blur.call(event.target);
    }
  };

  refresh();
  ownerDocument.addEventListener("keydown", onKeyDown, true);
  root.addEventListener("pointerdown", onPointerDown, true);
  root.addEventListener("focusin", onFocusIn, true);

  return {
    refresh,
    destroy(): void {
      ownerDocument.removeEventListener("keydown", onKeyDown, true);
      root.removeEventListener("pointerdown", onPointerDown, true);
      root.removeEventListener("focusin", onFocusIn, true);
    },
  };
}
