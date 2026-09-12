import type { WorldEvent } from "../../world/WorldTypes.js";
import type { WorldCalloutCue } from "./WorldCallout.js";

/** 把一个语义 WorldEvent 映射为纯表现 Callout。 */
export interface WorldCalloutDefinition {
  id: string;
  eventType: string;
  resolve(event: Readonly<WorldEvent>): WorldCalloutCue | null;
}
