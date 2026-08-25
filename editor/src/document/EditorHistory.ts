import { cloneEditorLevel } from "../level/editorLevel.js";
import type { EditorLevel } from "../level/types.js";

const HISTORY_LIMIT = 100;

export class EditorHistory {
  private readonly undoStack: EditorLevel[] = [];
  private readonly redoStack: EditorLevel[] = [];

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }

  record(previous: EditorLevel): void {
    this.undoStack.push(cloneEditorLevel(previous));
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  undo(current: EditorLevel): EditorLevel | null {
    const previous = this.undoStack.pop();
    if (!previous) return null;
    this.redoStack.push(cloneEditorLevel(current));
    return cloneEditorLevel(previous);
  }

  redo(current: EditorLevel): EditorLevel | null {
    const next = this.redoStack.pop();
    if (!next) return null;
    this.undoStack.push(cloneEditorLevel(current));
    return cloneEditorLevel(next);
  }
}
