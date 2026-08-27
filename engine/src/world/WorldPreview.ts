import type { LevelMap } from "@bobby/model";
import type { EntityDefinition } from "./entity/EntityDefinition.js";
import type { EntityInstance } from "./entity/EntityInstance.js";
import type { EntityRegistry } from "./entity/EntityRegistry.js";
import { EntityStore } from "./entity/EntityStore.js";
import type { EntityPresence } from "./spatial/EntityPresence.js";
import { SpatialIndex } from "./spatial/SpatialIndex.js";

export interface PresenceInspection {
  presence: EntityPresence;
  entity: Readonly<EntityInstance>;
  definition: EntityDefinition;
}

export interface CellInspection {
  x: number;
  y: number;
  presences: readonly PresenceInspection[];
  top: PresenceInspection | null;
}

/** Editor / Debug 共用的只读 World 空间预览。 */
export class WorldPreview {
  readonly entities: EntityStore;
  readonly spatial: SpatialIndex;

  constructor(
    readonly level: LevelMap,
    readonly registry: EntityRegistry,
  ) {
    this.entities = new EntityStore(level.entities);
    this.spatial = new SpatialIndex(
      this.entities,
      registry,
      level.width,
      level.height,
    );
  }

  inspectCell(x: number, y: number): CellInspection {
    const presences = this.spatial.presencesAt({ x, y }).map((presence) => {
      const entity = this.entities.require(presence.entityId);
      return {
        presence,
        entity,
        definition: this.registry.require(entity.type),
      };
    });
    return {
      x,
      y,
      presences,
      top: presences.at(-1) ?? null,
    };
  }
}
