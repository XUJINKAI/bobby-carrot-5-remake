export interface BackdropDismissHandlers {
  pointerDown(event: PointerEvent): void;
  pointerUp(event: PointerEvent): void;
  pointerCancel(event: PointerEvent): void;
}

/** 只有一次指针手势完整发生在遮罩空白处时，才关闭上层面板。 */
export function createBackdropDismissHandlers(
  dismiss: () => void,
): BackdropDismissHandlers {
  const backdropPointers = new Set<number>();

  return {
    pointerDown(event): void {
      if (isBackdropEvent(event)) backdropPointers.add(event.pointerId);
      else backdropPointers.delete(event.pointerId);
    },
    pointerUp(event): void {
      const startedOnBackdrop = backdropPointers.delete(event.pointerId);
      if (startedOnBackdrop && isBackdropEvent(event)) dismiss();
    },
    pointerCancel(event): void {
      backdropPointers.delete(event.pointerId);
    },
  };
}

function isBackdropEvent(event: PointerEvent): boolean {
  return event.target === event.currentTarget;
}
