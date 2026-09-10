import type { Cell } from "../authoring/entityPlacement.js";
import { canvasPointToCell } from "./coordinates.js";
import { EditorViewport } from "./EditorViewport.js";

export interface EditorCanvasInputHandlers {
  dimensions(): { width: number; height: number };
  hover(cell: Cell | null): void;
  primaryStart(cell: Cell): void;
  primaryMove(cell: Cell): void;
  primaryEnd(cell: Cell | null): void;
  secondarySelect(cell: Cell): void;
  viewportChanged(): void;
}

interface PointerPosition { x: number; y: number; }

export class EditorCanvasInput {
  private enabled = true;
  private primaryPointer: number | null = null;
  private middlePointer: number | null = null;
  private lastMiddle: PointerPosition | null = null;
  private lastPrimaryCell = "";
  private readonly pointers = new Map<number, PointerPosition>();
  private pinchDistance = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly viewport: EditorViewport,
    private readonly handlers: EditorCanvasInputHandlers,
  ) {
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("lostpointercapture", this.onPointerUp);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("contextmenu", this.onContextMenu);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.finishPrimary(null);
  }

  destroy(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("lostpointercapture", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (event.button === 0 || event.button === 1)
      this.canvas.setPointerCapture(event.pointerId);
    if (this.pointers.size >= 2) {
      this.finishPrimary(null);
      this.pinchDistance = pointerDistance([...this.pointers.values()]);
      return;
    }
    if (event.button === 1) {
      event.preventDefault();
      this.middlePointer = event.pointerId;
      this.lastMiddle = { x: event.clientX, y: event.clientY };
      return;
    }
    if (event.button !== 0) return;
    event.preventDefault();
    const cell = this.cell(event);
    if (!cell) return;
    this.primaryPointer = event.pointerId;
    this.lastPrimaryCell = `${cell.x},${cell.y}`;
    this.handlers.hover(cell);
    this.handlers.primaryStart(cell);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.enabled) return;
    if (this.pointers.has(event.pointerId))
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size >= 2) {
      const points = [...this.pointers.values()];
      const distance = pointerDistance(points);
      const center = pointerCenter(points);
      if (this.pinchDistance > 0)
        this.viewport.zoomAt(distance / this.pinchDistance, center.x, center.y);
      this.pinchDistance = distance;
      this.handlers.viewportChanged();
      return;
    }
    if (this.middlePointer === event.pointerId && this.lastMiddle) {
      this.viewport.panBy(event.clientX - this.lastMiddle.x, event.clientY - this.lastMiddle.y);
      this.lastMiddle = { x: event.clientX, y: event.clientY };
      this.handlers.viewportChanged();
      return;
    }
    const cell = this.cell(event);
    this.handlers.hover(cell);
    if (!cell || this.primaryPointer !== event.pointerId) return;
    const key = `${cell.x},${cell.y}`;
    if (key === this.lastPrimaryCell) return;
    this.lastPrimaryCell = key;
    this.handlers.primaryMove(cell);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const cell = this.cell(event);
    this.pointers.delete(event.pointerId);
    if (this.middlePointer === event.pointerId) {
      this.middlePointer = null;
      this.lastMiddle = null;
    }
    if (this.primaryPointer === event.pointerId) this.finishPrimary(cell);
    if (this.pointers.size < 2) this.pinchDistance = 0;
  };

  private readonly onPointerLeave = (): void => {
    if (this.primaryPointer === null && this.middlePointer === null)
      this.handlers.hover(null);
  };

  private readonly onContextMenu = (event: MouseEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();
    const cell = this.cell(event);
    if (!cell) return;
    this.handlers.secondarySelect(cell);
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    this.viewport.zoomAt(
      event.deltaY < 0 ? 1.08 : 1 / 1.08,
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
    this.handlers.viewportChanged();
  };

  private finishPrimary(cell: Cell | null): void {
    if (this.primaryPointer !== null) this.handlers.primaryEnd(cell);
    this.primaryPointer = null;
    this.lastPrimaryCell = "";
  }

  private cell(event: { clientX: number; clientY: number }): Cell | null {
    const dimensions = this.handlers.dimensions();
    return canvasPointToCell(
      this.canvas,
      dimensions.width,
      dimensions.height,
      event.clientX,
      event.clientY,
    );
  }
}

function pointerDistance(points: PointerPosition[]): number {
  const [a, b] = points;
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
}

function pointerCenter(points: PointerPosition[]): PointerPosition {
  const [a, b] = points;
  return a && b
    ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    : { x: 0, y: 0 };
}
