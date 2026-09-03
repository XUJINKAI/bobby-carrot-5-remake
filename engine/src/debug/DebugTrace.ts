import type { EntityId } from "../world/entity/EntityInstance.js";

export type DebugTraceCategory =
  | "input"
  | "action"
  | "world"
  | "presentation"
  | "event";

export interface DebugTraceEntry {
  seq: number;
  category: DebugTraceCategory;
  summary: string;
  worldTick: number | null;
  presentationFrame: number;
  actorId?: EntityId;
  detail?: unknown;
}

export interface DebugTraceRecord {
  category: DebugTraceCategory;
  summary: string;
  worldTick: number | null;
  presentationFrame: number;
  actorId?: EntityId;
  detail?: unknown;
}

/** Small debug-only ring buffer. Sequence, not either clock, defines causal order. */
export class DebugTraceRecorder {
  private readonly entries: DebugTraceEntry[] = [];
  private nextSeq = 1;

  constructor(private readonly capacity = 50) {}

  record(record: DebugTraceRecord): void {
    this.entries.push({
      seq: this.nextSeq++,
      category: record.category,
      summary: record.summary,
      worldTick: record.worldTick,
      presentationFrame: record.presentationFrame,
      ...(record.actorId !== undefined ? { actorId: record.actorId } : {}),
      ...(record.detail !== undefined
        ? { detail: structuredClone(record.detail) }
        : {}),
    });
    while (this.entries.length > this.capacity) this.entries.shift();
  }

  snapshot(): readonly DebugTraceEntry[] {
    return this.entries.map((entry) => structuredClone(entry));
  }

  clear(): void {
    this.entries.length = 0;
  }
}
