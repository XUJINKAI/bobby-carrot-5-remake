import type { Cell } from "../authoring/entityPlacement.js";
import { canvasPointToCell } from "./coordinates.js";
import { EditorViewport } from "./EditorViewport.js";

export interface EditorCanvasInputHandlers {
  dimensions(): { width: number; height: number };
  hover(cell: Cell | null): void;
  stroke(cell: Cell, button: 0 | 2): void;
  beginStroke(): void;
  endStroke(): void;
  transform(cell: Cell, step: number): boolean;
  viewportChanged(): void;
}

interface PointerPosition {
  x: number;
  y: number;
}

export class EditorCanvasInput {
  private enabled = true;
  private strokeButton: 0 | 2 | null = null;
  private middlePointer: number | null = null;
  private lastMiddle: PointerPosition | null = null;
  private lastStroke = "";
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
    canvas.addEventListener("contextmenu", preventDefault);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.finishStroke();
  }

  destroy(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("lostpointercapture", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("contextmenu", preventDefault);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.canvas.setPointerCapture(event.pointerId);
    if (this.pointers.size >= 2) {
      this.finishStroke();
      this.pinchDistance = pointerDistance([...this.pointers.values()]);
      return;
    }
    if (event.button === 1) {
      event.preventDefault();
      this.middlePointer = event.pointerId;
      this.lastMiddle = { x: event.clientX, y: event.clientY };
      return;
    }
    if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault();
    this.strokeButton = event.button as 0 | 2;
    this.lastStroke = "";
    this.handlers.beginStroke();
    this.applyStroke(event);
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
        this.viewport.zoomAt(
          distance / this.pinchDistance,
          center.x,
          center.y,
        );
      this.pinchDistance = distance;
      this.handlers.viewportChanged();
      return;
    }
    if (this.middlePointer === event.pointerId && this.lastMiddle) {
      this.viewport.panBy(
        event.clientX - this.lastMiddle.x,
        event.clientY - this.lastMiddle.y,
      );
      this.lastMiddle = { x: event.clientX, y: event.clientY };
      this.handlers.viewportChanged();
      return;
    }
    const cell = this.cell(event);
    this.handlers.hover(cell);
    if (cell && this.strokeButton !== null) this.applyCell(cell);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.pointers.delete(event.pointerId);
    if (this.middlePointer === event.pointerId) {
      this.middlePointer = null;
      this.lastMiddle = null;
    }
    if (this.strokeButton !== null) this.finishStroke();
    if (this.pointers.size < 2) this.pinchDistance = 0;
  };

  private readonly onPointerLeave = (): void => {
    if (this.strokeButton === null && this.middlePointer === null)
      this.handlers.hover(null);
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();
    const cell = this.cell(event);
    if (cell && this.handlers.transform(cell, event.deltaY > 0 ? 1 : -1))
      return;
    const rect = this.canvas.getBoundingClientRect();
    this.viewport.zoomAt(
      event.deltaY < 0 ? 1.08 : 1 / 1.08,
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
    this.handlers.viewportChanged();
  };

  private applyStroke(event: PointerEvent): void {
    const cell = this.cell(event);
    if (cell) {
      this.handlers.hover(cell);
      this.applyCell(cell);
    }
  }

  private applyCell(cell: Cell): void {
    if (this.strokeButton === null) return;
    const key = `${cell.x},${cell.y}:${this.strokeButton}`;
    if (key === this.lastStroke) return;
    this.lastStroke = key;
    this.handlers.stroke(cell, this.strokeButton);
  }

  private finishStroke(): void {
    if (this.strokeButton !== null) this.handlers.endStroke();
    this.strokeButton = null;
    this.lastStroke = "";
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

function preventDefault(event: Event): void {
  event.preventDefault();
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
