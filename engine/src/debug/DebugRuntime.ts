import type { CellInspection } from "../world/WorldTypes.js";
import type { CellPosition, EntityId } from "../world/entity/EntityInstance.js";
import { DebugSidebar } from "./DebugSidebar.js";
import type { DebugSelection, DebugSnapshot } from "./DebugSnapshot.js";

export interface DebugRuntimeHost {
  snapshot(selection: DebugSelection | null): DebugSnapshot;
  inspectPoint(clientX: number, clientY: number): CellInspection | null;
  pause(): void;
  resume(): void;
  step(count: number): void;
  close(): void;
  selectionChanged(cell: CellPosition | null): void;
  requestRender(): void;
}

interface PointerStart {
  x: number;
  y: number;
}

/** Debug Sidebar、Cell selection 与 Clock controls 的 Engine 内部协调器。 */
export class DebugRuntime {
  private readonly sidebar: DebugSidebar;
  private readonly pointerStarts = new Map<number, PointerStart>();
  private selection: DebugSelection | null = null;
  private enabled = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly host: DebugRuntimeHost,
  ) {
    this.sidebar = new DebugSidebar(canvas, {
      pause: () => this.host.pause(),
      resume: () => this.host.resume(),
      step: (count) => this.host.step(count),
      close: () => this.host.close(),
      selectEntity: (entityId) => this.selectEntity(entityId),
    });
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerCancel);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.sidebar.setEnabled(enabled);
    this.host.selectionChanged(enabled ? (this.selection?.cell ?? null) : null);
  }

  clearSelection(): void {
    this.selection = null;
    this.host.selectionChanged(null);
  }

  render(): void {
    if (!this.enabled) return;
    this.sidebar.render(this.host.snapshot(this.selection));
  }

  destroy(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
    this.sidebar.destroy();
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
