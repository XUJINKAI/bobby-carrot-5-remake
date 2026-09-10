import type { VisualQuery } from "@bobby/engine";
import { EditorPreview } from "./EditorPreview.js";
import type { EntityPlacementPlan } from "./entityPlacement.js";

/** 只实例化待放置对象；通过只读查询叠加替换结果，保留任意邻格的视觉上下文。 */
export function createPlacementPreview(base: EditorPreview, plan: EntityPlacementPlan) {
  const ghost = new EditorPreview({
    ...base.level,
    entities: [plan.entity],
  }, base.catalog);
  // 预览对象排在同层现有对象之后，与正式放置时追加 Entity 的顺序一致。
  const entity = { ...ghost.entities.require(1), id: Number.MAX_SAFE_INTEGER };
  const inspections = ghost.presencesFor({ index: 0 }).map((inspection) => ({
    ...inspection,
    presence: { ...inspection.presence, entityId: entity.id },
  }));
  const removed = new Set(plan.replace.flatMap((ref) =>
    base.presencesFor(ref).map((item) => item.presence.entityId),
  ));
  const query: VisualQuery = {
    inBounds: (cell) => base.spatial.inBounds(cell),
    entity: (id) => id === entity.id
      ? entity
      : removed.has(id) ? undefined : base.entities.get(id),
    presencesAt(cell) {
      const presences = base.spatial.presencesAt(cell)
        .filter((presence) => !removed.has(presence.entityId));
      for (const inspection of inspections) {
        const presence = inspection.presence;
        if (presence.cell.x === cell.x && presence.cell.y === cell.y)
          presences.push(presence);
      }
      return presences.sort((a, b) => a.stackOrder - b.stackOrder || a.entityId - b.entityId);
    },
    entitiesWithTrait(trait) {
      const entities = base.spatial.entityIdsWithTrait(trait)
        .filter((id) => !removed.has(id))
        .map((id) => base.entities.require(id));
      if (inspections.some((item) => item.presence.traits.includes(trait)))
        entities.push(entity);
      return entities;
    },
  };
  return { inspections, query };
}
