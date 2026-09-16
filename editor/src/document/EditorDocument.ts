import { cloneEditorLevel, normalizeEditorLevel } from "../level/editorLevel.js";
import { serializeEditorLevel } from "../level/serialization.js";
import type { EditorMap } from "../level/types.js";
import { EditorHistory } from "./EditorHistory.js";
import type { EditorCommand } from "./commands.js";

export interface EditorSnapshot {
  level: Readonly<EditorMap>;
  revision: number;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
}

export type EditorDocumentListener = (snapshot: EditorSnapshot) => void;

export class EditorDocument {
  private level: EditorMap;
  private readonly history = new EditorHistory();
  private readonly listeners = new Set<EditorDocumentListener>();
  private revision = 0;
  private currentFingerprint: string;
  private savedFingerprint: string;
  private transactionStart: EditorMap | null = null;
  private transactionStartFingerprint: string | null = null;

  constructor(level: EditorMap) {
    this.level = normalizeEditorLevel(level);
    this.currentFingerprint = fingerprint(this.level);
    this.savedFingerprint = this.currentFingerprint;
  }

  getSnapshot(): EditorSnapshot {
    return {
      level: cloneEditorLevel(this.level),
      revision: this.revision,
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
      dirty: this.currentFingerprint !== this.savedFingerprint,
    };
  }

  subscribe(listener: EditorDocumentListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  execute(command: EditorCommand): boolean {
    return this.applyCommand(command);
  }

  beginTransaction(): void {
    if (this.transactionStart) return;
    this.transactionStart = cloneEditorLevel(this.level);
    this.transactionStartFingerprint = this.currentFingerprint;
  }

  commitTransaction(): void {
    const start = this.transactionStart;
    const startFingerprint = this.transactionStartFingerprint;
    this.transactionStart = null;
    this.transactionStartFingerprint = null;
    if (!start || startFingerprint === this.currentFingerprint) return;
    this.history.record(start);
    this.changed();
  }

  cancelTransaction(): void {
    const start = this.transactionStart;
    const startFingerprint = this.transactionStartFingerprint;
    this.transactionStart = null;
    this.transactionStartFingerprint = null;
    if (!start || startFingerprint === this.currentFingerprint) return;
    this.level = start;
    this.currentFingerprint = startFingerprint ?? fingerprint(start);
    this.changed();
  }

  undo(): void {
    this.cancelTransaction();
    const previous = this.history.undo(this.level);
    if (!previous) return;
    this.level = previous;
    this.currentFingerprint = fingerprint(previous);
    this.changed();
  }

  redo(): void {
    this.cancelTransaction();
    const next = this.history.redo(this.level);
    if (!next) return;
    this.level = next;
    this.currentFingerprint = fingerprint(next);
    this.changed();
  }

  load(level: EditorMap): void {
    this.transactionStart = null;
    this.transactionStartFingerprint = null;
    this.level = normalizeEditorLevel(level);
    this.currentFingerprint = fingerprint(this.level);
    this.history.clear();
    this.savedFingerprint = this.currentFingerprint;
    this.changed();
  }

  markSaved(): void {
    this.savedFingerprint = this.currentFingerprint;
    this.emit();
  }

  private applyCommand(command: EditorCommand): boolean {
    const next = command.apply(this.level);
    if (next === this.level) return false;
    const normalized = normalizeEditorLevel(next);
    const nextFingerprint = fingerprint(normalized);
    if (nextFingerprint === this.currentFingerprint) return false;
    if (!this.transactionStart) this.history.record(this.level);
    this.level = normalized;
    this.currentFingerprint = nextFingerprint;
    this.changed();
    return true;
  }

  private changed(): void {
    this.revision++;
    this.emit();
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}

function fingerprint(level: EditorMap): string {
  return serializeEditorLevel(level);
}
