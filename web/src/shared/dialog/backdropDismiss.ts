export interface BackdropDismissHandlers {
  pointerDown(event: PointerEvent): void;
  pointerUp(event: PointerEvent): void;
  pointerCancel(event: PointerEvent): void;
  click(event: MouseEvent): void;
}

/**
 * 只有一次指针手势完整发生在遮罩空白处时，才关闭上层面板。
 * 遮罩保留到 click，避免触屏合成 click 重新命中刚暴露的后方控件。
 */
export function createBackdropDismissHandlers(
  dismiss: () => void,
): BackdropDismissHandlers {
  const backdropPointers = new Set<number>();
  const completedBackdropPointers = new Set<number>();

  return {
    pointerDown(event): void {
      completedBackdropPointers.clear();
      if (isBackdropEvent(event)) {
        backdropPointers.add(event.pointerId);
      } else {
        backdropPointers.delete(event.pointerId);
      }
    },
    pointerUp(event): void {
      const startedOnBackdrop = backdropPointers.delete(event.pointerId);
      if (startedOnBackdrop && isBackdropEvent(event)) {
        completedBackdropPointers.add(event.pointerId);
      } else {
        completedBackdropPointers.delete(event.pointerId);
      }
    },
    pointerCancel(event): void {
      backdropPointers.delete(event.pointerId);
      completedBackdropPointers.delete(event.pointerId);
    },
    click(event): void {
      const completed = consumeCompletedPointer(
        event,
        completedBackdropPointers,
      );
      if (completed && isBackdropEvent(event)) dismiss();
    },
  };
}

function consumeCompletedPointer(
  event: MouseEvent,
  completedPointers: Set<number>,
): boolean {
  if ("pointerId" in event && typeof event.pointerId === "number") {
    if (completedPointers.delete(event.pointerId)) return true;
  }
  if (completedPointers.size !== 1) return false;
  completedPointers.clear();
  return true;
}

function isBackdropEvent(event: MouseEvent | PointerEvent): boolean {
  return event.target === event.currentTarget;
}
