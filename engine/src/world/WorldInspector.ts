import type { CellPosition } from "./entity/EntityInstance.js";
import type { EntityStore } from "./entity/EntityStore.js";
import type { SpatialIndex } from "./spatial/SpatialIndex.js";
import type { CellInspection, PresenceInspection } from "./WorldTypes.js";

/** 将只读 debug inspection 与 World orchestration 分离。 */
export class WorldInspector {
  constructor(
    private readonly entities: EntityStore,
    private readonly spatial: SpatialIndex,
  ) {}

  inspect(cell: CellPosition): CellInspection | null {
    if (!this.spatial.inBounds(cell)) return null;
    const rawPresences = this.spatial.presencesAt(cell);
    const presences = rawPresences.map((presence) => {
      const entity = this.entities.require(presence.entityId);
      return {
        entityId: entity.id,
        type: entity.type,
        layer: presence.layer,
        ...(presence.role ? { role: presence.role } : {}),
        stackOrder: presence.stackOrder,
        traits: presence.traits,
        ...(entity.state ? { state: structuredClone(entity.state) } : {}),
      } satisfies PresenceInspection;
    });
    const topPresence = presences.at(-1);
    const actorIds = [
      ...new Set(
        rawPresences
          .filter((presence) => presence.traits.includes("player"))
          .map((presence) => presence.entityId),
      ),
    ];
    return {
      cell: { ...cell },
      presences,
      ...(topPresence ? { topPresence } : {}),
      actorIds,
    };
  }
}
