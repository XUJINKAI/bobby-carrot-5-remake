import type { WorldEvent } from "../world/WorldTypes.js";
import type { TransientVisualDefinition } from "./VisualDefinition.js";

export interface ActiveTransientVisual {
  id: number;
  definition: TransientVisualDefinition;
  event: WorldEvent;
  x: number;
  y: number;
  startedAtMs: number;
  durationMs: number;
}

export function resolveTransientDuration(
  definition: TransientVisualDefinition,
  event: Readonly<WorldEvent>,
): number {
  const value = typeof definition.durationMs === "function"
    ? definition.durationMs(event)
    : definition.durationMs;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
