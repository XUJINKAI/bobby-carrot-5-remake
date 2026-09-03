/** 解析 Engine 叠加层容器，并保证绝对定位以该容器为坐标系。 */
export function resolveGameplayMount(
  canvas: HTMLCanvasElement,
  root: HTMLElement | undefined,
  owner: string,
): HTMLElement {
  const mount = root ?? canvas.parentElement;
  if (!mount) throw new Error(`${owner} 需要可挂载的 Engine 容器`);
  if (window.getComputedStyle(mount).position === "static") {
    mount.style.position = "relative";
  }
  return mount;
}

export const GAMEPLAY_RIGHT_INSET_CSS_VAR = "--engine-gameplay-right-inset";

export interface GameplayRightInsetLease {
  set(pixels: number): void;
  release(): void;
}

/**
 * 为挂在 gameplay mount 右侧的 Engine UI 预留真实布局空间。
 * Canvas 使用剩余宽度；HUD / pointer UI 通过同一 CSS variable 对齐该区域。
 */
export function createGameplayRightInset(
  canvas: HTMLCanvasElement,
  owner: string,
): GameplayRightInsetLease {
  const mount = resolveGameplayMount(canvas, undefined, owner);
  const previousInset = mount.style.getPropertyValue(GAMEPLAY_RIGHT_INSET_CSS_VAR);
  const previousCanvasWidth = canvas.style.width;
  let released = false;

  return {
    set(pixels: number): void {
      if (released) return;
      const width = Math.max(0, Math.round(pixels));
      mount.style.setProperty(GAMEPLAY_RIGHT_INSET_CSS_VAR, `${width}px`);
      canvas.style.width = `calc(100% - var(${GAMEPLAY_RIGHT_INSET_CSS_VAR}, 0px))`;
    },
    release(): void {
      if (released) return;
      released = true;
      if (previousInset) {
        mount.style.setProperty(GAMEPLAY_RIGHT_INSET_CSS_VAR, previousInset);
      } else {
        mount.style.removeProperty(GAMEPLAY_RIGHT_INSET_CSS_VAR);
      }
      canvas.style.width = previousCanvasWidth;
    },
  };
}
