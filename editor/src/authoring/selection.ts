import type { EditorSelection } from "../definitions/types.js";
import type { EditorMap, EntityRef } from "../level/types.js";
import { EditorPreview } from "./EditorPreview.js";

export interface SelectionRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function selectionRect(selection: EditorSelection): SelectionRect {
  const left = Math.min(selection.anchor.x, selection.focus.x);
  const top = Math.min(selection.anchor.y, selection.focus.y);
  const right = Math.max(selection.anchor.x, selection.focus.x);
  const bottom = Math.max(selection.anchor.y, selection.focus.y);
  return {
    left,
    top,
    right,
    bottom,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

export function selectedEntityRefs(
  level: EditorMap,
  preview: EditorPreview,
  selection: EditorSelection,
): EntityRef[] {
  const rect = selectionRect(selection);
  const refs = new Map<number, EntityRef>();
  for (let y = rect.top; y <= rect.bottom; y += 1)
    for (let x = rect.left; x <= rect.right; x += 1)
      for (const presence of preview.inspectCell(x, y).presences)
        refs.set(presence.ref.index, presence.ref);
  return [...refs.values()].filter((ref) => Boolean(level.entities[ref.index]));
}
