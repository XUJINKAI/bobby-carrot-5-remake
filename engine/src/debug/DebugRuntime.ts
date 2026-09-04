import type { Direction } from "@bobby/model";
import type { CellInspection } from "../world/WorldTypes.js";
import type { WorldDelta } from "../world/delta/WorldDelta.js";
import type { CellPosition, EntityId } from "../world/entity/EntityInstance.js";
import { DebugSidebar } from "./DebugSidebar.js";
import { DebugTraceRecorder } from "./DebugTrace.js";
import type {
  DebugEntitySnapshot,
  DebugSelection,
  DebugSnapshot,
} from "./DebugSnapshot.js";

export interface DebugRuntimeHost {
  snapshot(
    selection: DebugSelection | null,
    actorId: EntityId | null,
  ): DebugSnapshot;
  inspectPoint(clientX: number, clientY: number): CellInspection | null;
  pause(): void;
  resume(): void;
  step(count: number): void;
  setHeldDirection(actorId: EntityId, direction: Direction | null): void;
  teleportActor(actorId: EntityId, cell: CellPosition): boolean;
  pausePresentation(): void;
  resumePresentation(): void;
  stepPresentation(frames: number): void;
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
  private previousSnapshot: DebugSnapshot | null = null;
  private trackedActorId: EntityId | null = null;
  private debugInputActorId: EntityId | null = null;
  private enabled = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly host: DebugRuntimeHost,
  ) {
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerCancel);
    canvas.addEventListener("dblclick", this.onDoubleClick);
  }

  setEnabled(enabled: boolean): void {
    if (!enabled) this.releaseDebugInput();
    this.enabled = enabled;
    if (enabled) this.ensureSidebar().setEnabled(true);
    else this.sidebar?.setEnabled(false);
    this.previousSnapshot = null;
    this.host.selectionChanged(enabled ? (this.selection?.cell ?? null) : null);
  }

  clearSelection(): void {
    this.selection = null;
    this.host.selectionChanged(null);
  }

  render(): void {
    if (!this.enabled) return;
    const snapshot = this.host.snapshot(this.selection, this.trackedActorId);
    this.trackedActorId = snapshot.actor?.id ?? null;
    this.captureSnapshotDiff(snapshot);
    this.ensureSidebar().render({ ...snapshot, trace: this.trace.snapshot() });
    this.previousSnapshot = structuredClone(snapshot);
  }

  /** WorldDelta 是 Timeline 的权威 gameplay 内容；snapshot diff 只补充输入和表现变化。 */
  recordWorldDeltas(
    deltas: readonly WorldDelta[],
    presentationFrame: number,
  ): void {
    if (!this.enabled) return;
    for (const delta of deltas)
      this.trace.record(traceRecordForDelta(delta, presentationFrame));
  }

  destroy(): void {
    this.releaseDebugInput();
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
    this.canvas.removeEventListener("dblclick", this.onDoubleClick);
    this.sidebar?.destroy();
    this.sidebar = null;
  }

  private ensureSidebar(): DebugSidebar {
    if (!this.sidebar) {
      this.sidebar = new DebugSidebar(this.canvas, {
        pauseWorld: () => this.host.pause(),
        resumeWorld: () => {
          this.releaseDebugInput();
          this.host.resume();
        },
        stepWorld: () => this.host.step(1),
        setHeldDirection: (direction) => {
          const actorId =
            this.trackedActorId ??
            this.host.snapshot(this.selection, null).actor?.id ??
            null;
          if (actorId === null) return;
          this.host.setHeldDirection(actorId, direction);
          this.debugInputActorId = direction === null ? null : actorId;
          this.host.requestRender();
        },
        selectActor: (actorId) => {
          if (actorId === this.trackedActorId) return;
          this.releaseDebugInput();
          this.trackedActorId = actorId;
          this.previousSnapshot = null;
          this.host.requestRender();
        },
        pausePresentation: () => this.host.pausePresentation(),
        resumePresentation: () => this.host.resumePresentation(),
        stepPresentation: (frames) => this.host.stepPresentation(frames),
        stepPresentationToNextSprite: () =>
          this.stepPresentationToNextSprite(),
        stepPresentationToNextChange: () => this.stepPresentationToNextChange(),
        clearTrace: () => {
          this.trace.clear();
          this.previousSnapshot = null;
          this.host.requestRender();
        },
        selectEntity: (entityId) => this.selectEntity(entityId),
        layoutChanged: () => this.host.requestRender(),
      });
    }
    return this.sidebar;
  }

  private releaseDebugInput(): void {
    if (this.debugInputActorId === null) return;
    this.host.setHeldDirection(this.debugInputActorId, null);
    this.debugInputActorId = null;
  }

  /** Advance until the selected actor actually resolves to a different sprite frame. */
  private stepPresentationToNextSprite(): void {
    let snapshot = this.host.snapshot(this.selection, this.trackedActorId);
    if (!snapshot.runtime.presentationPaused || !snapshot.actor) return;
    const initialSignature = spriteSignature(snapshot.actor);
    if (initialSignature === null || !hasActiveActorPresentation(snapshot.actor))
      return;

    for (let frame = 0; frame < 240; frame += 1) {
      this.host.stepPresentation(1);
      snapshot = this.host.snapshot(this.selection, this.trackedActorId);
      if (!snapshot.actor) break;
      const signature = spriteSignature(snapshot.actor);
      if (signature !== null && signature !== initialSignature) break;
      if (!hasActiveActorPresentation(snapshot.actor)) break;
    }
  }

  /** Jump presentation to the end of the current visible motion without changing Hz. */
  private stepPresentationToNextChange(): void {
    let snapshot = this.host.snapshot(this.selection, this.trackedActorId);
    if (!snapshot.runtime.presentationPaused) return;
    if (!snapshot.runtime.animating) {
      this.host.stepPresentation(1);
      return;
    }
    for (let frame = 0; frame < 240; frame += 1) {
      this.host.stepPresentation(1);
      snapshot = this.host.snapshot(this.selection, this.trackedActorId);
      if (!snapshot.runtime.animating) break;
    }
  }

  private captureSnapshotDiff(snapshot: DebugSnapshot): void {
    const previous = this.previousSnapshot;
    if (!previous) return;
    const clock = {
      worldTick: snapshot.runtime.worldTickCount,
      presentationFrame: snapshot.runtime.presentationFrame,
    };

    if (snapshot.runtime.worldTickCount !== previous.runtime.worldTickCount)
      this.trace.record({
        category: "world",
        summary: `world tick ${previous.runtime.worldTickCount} -> ${snapshot.runtime.worldTickCount}`,
        ...clock,
      });

    const actor = snapshot.actor;

    if (JSON.stringify(snapshot.input) !== JSON.stringify(previous.input)) {
      const active = snapshot.input?.channels.filter(
        (channel) =>
          channel.physicalDirection !== null ||
          (channel.repeater?.heldInput ?? null) !== null ||
          (channel.repeater?.pendingAttempt ?? null) !== null,
      );
      this.trace.record({
        category: "input",
        summary:
          active && active.length > 0
            ? active
                .map(
                  (channel) =>
                    `${channel.source}:${channel.physicalDirection ?? channel.repeater?.heldInput?.direction ?? "pending"}`,
                )
                .join(" ")
            : "input idle",
        ...(actor ? { actorId: actor.id } : {}),
        detail: snapshot.input,
        ...clock,
      });
    }

    if (JSON.stringify(snapshot.actions) !== JSON.stringify(previous.actions))
      this.trace.record({
        category: "action",
        summary: `${snapshot.actions.length} active runtime action${snapshot.actions.length === 1 ? "" : "s"}`,
        detail: snapshot.actions,
        ...clock,
      });

    if (
      snapshot.runtime.animating !== previous.runtime.animating ||
      (snapshot.runtime.presentationPaused &&
        snapshot.runtime.presentationFrame !== previous.runtime.presentationFrame)
    )
      this.trace.record({
        category: "presentation",
        summary: snapshot.runtime.animating
          ? "presentation motion active"
          : "presentation motion idle",
        ...(actor ? { actorId: actor.id } : {}),
        ...clock,
      });
  }

  private selectEntity(entityId: EntityId): void {
    if (!this.selection) return;
    this.selection = { ...this.selection, entityId };
    const snapshot = this.host.snapshot(this.selection, this.trackedActorId);
    if (
      snapshot.selection?.entity?.id === entityId &&
      snapshot.selection.entity.definition.traits.includes("player")
    ) {
      this.releaseDebugInput();
      this.trackedActorId = entityId;
      this.previousSnapshot = null;
    }
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

  private readonly onDoubleClick = (event: MouseEvent): void => {
    if (!this.enabled || event.button !== 0) return;
    const inspection = this.host.inspectPoint(event.clientX, event.clientY);
    if (!inspection) return;
    const snapshot = this.host.snapshot(this.selection, this.trackedActorId);
    const actorId = snapshot.actor?.id;
    if (actorId === undefined) return;

    this.releaseDebugInput();
    if (!this.host.teleportActor(actorId, inspection.cell)) return;
    this.trackedActorId = actorId;
    this.selection = { cell: { ...inspection.cell }, entityId: actorId };
    this.previousSnapshot = null;
    this.host.selectionChanged(this.selection.cell);
    this.trace.record({
      category: "world",
      summary: `debug teleport #${actorId} -> ${inspection.cell.x},${inspection.cell.y}`,
      actorId,
      worldTick: snapshot.runtime.worldTickCount,
      presentationFrame: snapshot.runtime.presentationFrame,
    });
    event.preventDefault();
    this.host.requestRender();
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    this.pointerStarts.delete(event.pointerId);
  };
}

function primaryPointer(event: PointerEvent): boolean {
  return event.pointerType !== "mouse" || event.button === 0;
}

function traceRecordForDelta(
  delta: WorldDelta,
  presentationFrame: number,
): Parameters<DebugTraceRecorder["record"]>[0] {
  const base = {
    worldTick: delta.worldTick,
    worldTimeMs: delta.worldTimeMs,
    worldSequence: delta.sequence,
    presentationFrame,
    detail: delta,
  };
  switch (delta.type) {
    case "entity-moved":
      return {
        ...base,
        category: "world",
        actorId: delta.entityId,
        summary: `#${delta.entityId} anchor ${delta.from.x},${delta.from.y} -> ${delta.to.x},${delta.to.y}`,
      };
    case "entity-spawned":
    case "entity-destroyed":
    case "entity-direction-changed":
    case "entity-state-changed":
      return {
        ...base,
        category: "world",
        actorId: delta.entityId,
        summary: `${delta.type} #${delta.entityId}`,
      };
    case "global-state-changed":
      return { ...base, category: "world", summary: `global ${delta.key}` };
    case "action-started":
    case "action-cancelled":
      return {
        ...base,
        category: "action",
        summary: `${delta.type} #${delta.actionId}`,
      };
    case "motion-started":
    case "motion-progressed":
    case "motion-completed":
    case "motion-interrupted":
      return {
        ...base,
        category: "motion",
        actorId: delta.motion.entityId,
        summary: `${delta.type} #${delta.motion.entityId} @${delta.motion.progress.toFixed(2)}`,
      };
    case "motion-marker":
      return {
        ...base,
        category: "motion",
        actorId: delta.motion.entityId,
        summary: `#${delta.motion.entityId} marker ${delta.marker} @${delta.motion.progress.toFixed(2)}`,
      };
    case "actor-lifecycle-changed":
      return {
        ...base,
        category: "lifecycle",
        actorId: delta.actor.entityId,
        summary: `#${delta.actor.entityId} ${delta.actor.phase}`,
      };
    case "world-outcome-changed":
      return {
        ...base,
        category: "outcome",
        summary: `world ${delta.outcome.phase}`,
      };
    case "world-event":
      return {
        ...base,
        category: "event",
        ...(delta.event.entityId !== undefined
          ? { actorId: delta.event.entityId }
          : {}),
        summary: delta.event.type,
      };
  }
}

function hasActiveActorPresentation(actor: DebugEntitySnapshot): boolean {
  if (!actor.visual.runtime || typeof actor.visual.runtime !== "object")
    return false;
  const runtime = actor.visual.runtime as Record<string, unknown>;
  return runtime.moving === true || typeof runtime.animation === "string";
}

function spriteSignature(actor: DebugEntitySnapshot): string | null {
  const imageLayers = actor.visual.renderItems
    .flatMap((item) => item.layers)
    .filter((layer) => layer.kind === "image");
  const layer = imageLayers.at(-1);
  if (!layer) return null;
  return JSON.stringify({
    asset: layer.asset ?? null,
    frameIndex: layer.frameIndex ?? null,
    frameProgress: layer.frameProgress ?? null,
  });
}
