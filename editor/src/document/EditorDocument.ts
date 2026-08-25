import { cloneEditorLevel, normalizeEditorLevel } from "../level/editorLevel.js";
import { serializeEditorLevel } from "../level/serialization.js";
import type { EditorLevel } from "../level/types.js";
import { EditorHistory } from "./EditorHistory.js";
import type { EditorCommand } from "./commands.js";

export interface EditorSnapshot {
  level: Readonly<EditorLevel>;
  revision: number;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
}

export type EditorDocumentListener = (snapshot: EditorSnapshot) => void;

export class EditorDocument {
  private level: EditorLevel;
  private readonly history = new EditorHistory();
  private readonly listeners = new Set<EditorDocumentListener>();
  private revision = 0;
  private savedFingerprint: string;
  private transactionStart: EditorLevel | null = null;

  constructor(level: EditorLevel) {
    this.level = normalizeEditorLevel(level);
    this.savedFingerprint = fingerprint(this.level);
  }

  getSnapshot(): EditorSnapshot {
    return {
      level: cloneEditorLevel(this.level),
      revision: this.revision,
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
      dirty: fingerprint(this.level) !== this.savedFingerprint,
    };
  }

  subscribe(listener: EditorDocumentListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  execute(command: EditorCommand): boolean {
    const next = command.apply(this.level);
    if (next === this.level || fingerprint(next) === fingerprint(this.level))
      return false;
    if (!this.transactionStart) this.history.record(this.level);
    this.level = normalizeEditorLevel(next);
    this.changed();
    return true;
  }

  beginTransaction(): void {
    if (!this.transactionStart) this.transactionStart = cloneEditorLevel(this.level);
  }

  commitTransaction(): void {
    const start = this.transactionStart;
    this.transactionStart = null;
    if (!start || fingerprint(start) === fingerprint(this.level)) return;
    this.history.record(start);
    this.changed();
  }

  cancelTransaction(): void {
    const start = this.transactionStart;
    this.transactionStart = null;
    if (!start || fingerprint(start) === fingerprint(this.level)) return;
    this.level = start;
    this.changed();
  }

  undo(): void {
    this.cancelTransaction();
    const previous = this.history.undo(this.level);
    if (!previous) return;
    this.level = previous;
    this.changed();
  }

  redo(): void {
    this.cancelTransaction();
    const next = this.history.redo(this.level);
    if (!next) return;
    this.level = next;
    this.changed();
  }

  load(level: EditorLevel): void {
    this.transactionStart = null;
    this.level = normalizeEditorLevel(level);
    this.history.clear();
    this.savedFingerprint = fingerprint(this.level);
    this.changed();
  }

  markSaved(): void {
    this.savedFingerprint = fingerprint(this.level);
    this.emit();
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

function fingerprint(level: EditorLevel): string {
  return serializeEditorLevel(level);
}
