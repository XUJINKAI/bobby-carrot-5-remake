import type { WorldEvent } from "../../world/WorldTypes.js";
import type { WorldCalloutCue } from "./WorldCallout.js";
import type { WorldCalloutDefinition } from "./WorldCalloutDefinition.js";

export class WorldCalloutRegistry {
  private readonly definitions = new Map<string, WorldCalloutDefinition>();

  register(definition: WorldCalloutDefinition): void {
    if (this.definitions.has(definition.eventType))
      throw new Error(`重复 World Callout event：${definition.eventType}`);
    this.definitions.set(definition.eventType, definition);
  }

  resolve(event: Readonly<WorldEvent>): WorldCalloutCue | null {
    return this.definitions.get(event.type)?.resolve(event) ?? null;
  }
}
