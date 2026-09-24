import { inject, type App, type InjectionKey, type ObjectDirective } from "vue";
import type { KeyboardDialogOptions, WebKeyboard } from "./WebKeyboard.js";

const KEYBOARD: InjectionKey<WebKeyboard> = Symbol("web-keyboard");

export function provideWebKeyboard(app: App, keyboard: WebKeyboard): void {
  app.provide(KEYBOARD, keyboard);
}

export function useWebKeyboard(): WebKeyboard {
  const keyboard = inject(KEYBOARD);
  if (!keyboard) throw new Error("WebKeyboard 尚未注入");
  return keyboard;
}

/** 指令生命周期和弹窗 DOM 同步，避免组件推测其它组件何时渲染。 */
export function useKeyboardDialog(): ObjectDirective<HTMLElement, KeyboardDialogOptions> {
  const keyboard = useWebKeyboard();
  const disposers = new WeakMap<HTMLElement, () => void>();
  return {
    mounted(element, binding) {
      disposers.set(element, keyboard.openDialog(element, binding.value));
    },
    updated() {
      keyboard.refresh();
    },
    beforeUnmount(element) {
      disposers.get(element)?.();
      disposers.delete(element);
    },
  };
}
