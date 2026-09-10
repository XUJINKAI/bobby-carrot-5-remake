import type { EntityId } from "../world/entity/EntityInstance.js";

export type DebugTraceCategory =
  | "input"
  | "action"
  | "world"
  | "motion"
  | "lifecycle"
  | "outcome"
  | "presentation"
  | "intent"
  | "event";

export type DebugTraceKind =
  | "world-tick"
  | "world-delta"
  | "snapshot"
  | "debug-command";

export interface DebugTraceEntry {
  seq: number;
  kind: DebugTraceKind;
  category: DebugTraceCategory;
  summary: string;
  worldTick: number | null;
  worldTimeMs?: number;
  worldSequence?: number;
  presentationFrame: number;
  actorId?: EntityId;
  detail?: unknown;
}

export interface DebugTraceRecord {
  kind: DebugTraceKind;
  category: DebugTraceCategory;
  summary: string;
  worldTick: number | null;
  worldTimeMs?: number;
  worldSequence?: number;
  presentationFrame: number;
  actorId?: EntityId;
  detail?: unknown;
}

/** Debug 专用环形缓冲；因果顺序只由 sequence 定义，不依赖任一时钟。 */
export class DebugTraceRecorder {
  private readonly entries: DebugTraceEntry[] = [];
  private nextSeq = 1;

  constructor(private readonly capacity = 50) {}

  record(record: DebugTraceRecord): void {
    const entry: DebugTraceEntry = {
      seq: this.nextSeq++,
      kind: record.kind,
      category: record.category,
      summary: record.summary,
      worldTick: record.worldTick,
      presentationFrame: record.presentationFrame,
      ...(record.worldTimeMs !== undefined
        ? { worldTimeMs: record.worldTimeMs }
        : {}),
      ...(record.worldSequence !== undefined
        ? { worldSequence: record.worldSequence }
        : {}),
      ...(record.actorId !== undefined ? { actorId: record.actorId } : {}),
      ...(record.detail !== undefined
        ? { detail: structuredClone(record.detail) }
        : {}),
    };
    const previous = this.entries.at(-1);
    if (record.kind === "world-tick" && previous?.kind === "world-tick")
      this.entries[this.entries.length - 1] = entry;
    else this.entries.push(entry);
    while (this.entries.length > this.capacity) this.entries.shift();
  }

  snapshot(): readonly DebugTraceEntry[] {
    return this.entries.map((entry) => structuredClone(entry));
  }

  clear(): void {
    this.entries.length = 0;
  }
}
