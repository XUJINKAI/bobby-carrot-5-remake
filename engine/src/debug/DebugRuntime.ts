import type { CellInspection } from "../world/WorldTypes.js";
import type { CellPosition, EntityId } from "../world/entity/EntityInstance.js";
import { DebugSidebar } from "./DebugSidebar.js";
import { DebugTraceRecorder, type DebugTraceRecord } from "./DebugTrace.js";
import type { DebugSelection, DebugSnapshot } from "./DebugSnapshot.js";

export interface DebugRuntimeHost {
  snapshot(
    selection: DebugSelection | null,
    trace: ReturnType<DebugTraceRecorder["snapshot"]>,
  ): DebugSnapshot;
  inspectPoint(clientX: number, clientY: number): CellInspection | null;
  pause(): void;
  resume(): void;
  step(count: number): void;
  pausePresentation(): void;
  resumePresentation(): void;
  stepPresentation(frames: number): void;
  stepPresentationToNextChange(): void;
  close(): void;
  selectionChanged(cell: CellPosition | null): void;
  requestRender(): void;
}

interface PointerStart {
  x: number;
  y: number;
}

/** Debug Sidebar、Cell selection、trace 与两套 Clock controls 的 Engine 内部协调器。 */
export class DebugRuntime {
  private sidebar: DebugSidebar | null = null;
  private readonly pointerStarts = new Map<number, PointerStart>();
  private readonly trace = new DebugTraceRecorder(50);
  private selection: DebugSelection | null = null;
  private enabled = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly host: DebugRuntimeHost,
  ) {
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerCancel);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) this.ensureSidebar().setEnabled(true);
    else this.sidebar?.setEnabled(false);
    this.host.selectionChanged(enabled ? (this.selection?.cell ?? null) : null);
  }

  clearSelection(): void {
    this.selection = null;
    this.host.selectionChanged(null);
  }

  clearTrace(): void {
    this.trace.clear();
    this.host.requestRender();
  }

  record(record: DebugTraceRecord): void {
    if (!this.enabled) return;
    this.trace.record(record);
  }

  render(): void {
    if (!this.enabled) return;
    this.ensureSidebar().render(
      this.host.snapshot(this.selection, this.trace.snapshot()),
    );
  }

  destroy(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
    this.sidebar?.destroy();
    this.sidebar = null;
  }

  private ensureSidebar(): DebugSidebar {
    if (!this.sidebar) {
      this.sidebar = new DebugSidebar(this.canvas, {
        pauseWorld: () => this.host.pause(),
        resumeWorld: () => this.host.resume(),
        stepWorld: () => this.host.step(1),
        pausePresentation: () => this.host.pausePresentation(),
        resumePresentation: () => this.host.resumePresentation(),
        stepPresentation: (frames) => this.host.stepPresentation(frames),
        stepPresentationToNextChange: () =>
          this.host.stepPresentationToNextChange(),
        clearTrace: () => this.clearTrace(),
        close: () => this.host.close(),
        selectEntity: (entityId) => this.selectEntity(entityId),
      });
    }
    return this.sidebar;
  }

  private selectEntity(entityId: EntityId): void {
    if (!this.selection) return;
    this.selection = { ...this.selection, entityId };
    this.host.requestRender();
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled || !primaryPointer(event)) return;
    this.pointerStarts.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.enabled || !primaryPointer(event)) return;
    const start = this.pointerStarts.get(event.pointerId);
    this.pointerStarts.delete(event.pointerId);
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6)
      return;
    const inspection = this.host.inspectPoint(event.clientX, event.clientY);
    if (!inspection) return;
    this.selection = {
      cell: { ...inspection.cell },
      ...(inspection.topPresence
        ? { entityId: inspection.topPresence.entityId }
        : {}),
    };
    this.host.selectionChanged(this.selection.cell);
    this.host.requestRender();
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    this.pointerStarts.delete(event.pointerId);
  };
}

function primaryPointer(event: PointerEvent): boolean {
  return event.pointerType !== "mouse" || event.button === 0;
}
