import { resolveFootprintCells, type EntityCatalog } from "@bobby/engine";
import type { LevelEntity } from "@bobby/model";
import type { EditorCommand } from "../document/commands.js";
import { normalizeEditorLevel } from "../level/editorLevel.js";
import type { EditorMap, EntityRef } from "../level/types.js";

export function moveEntitiesBy(
  catalog: EntityCatalog,
  refs: readonly EntityRef[],
  dx: number,
  dy: number,
): EditorCommand {
  const offsetX = Math.trunc(dx);
  const offsetY = Math.trunc(dy);
  return {
    apply(level) {
      if ((offsetX === 0 && offsetY === 0) || refs.length === 0) return level;
      const indexes = [...new Set(refs.map((ref) => ref.index))].filter(
        (index) => Number.isInteger(index) && index >= 0 && index < level.entities.length,
      );
      if (indexes.length === 0) return level;

      const moved = indexes.map((index) => {
        const entity = level.entities[index]!;
        return {
          index,
          entity: {
            ...entity,
            x: entity.x + offsetX,
            y: entity.y + offsetY,
          },
        };
      });
      if (moved.some(({ entity }) => !entityFits(level, catalog, entity))) return level;

      const entities = [...level.entities];
      for (const item of moved) entities[item.index] = item.entity;
      return normalizeEditorLevel({ ...level, entities });
    },
  };
}

function entityFits(
  level: Readonly<EditorMap>,
  catalog: EntityCatalog,
  entity: LevelEntity,
): boolean {
  const definition = catalog.require(entity.type);
  return resolveFootprintCells(
    {
      anchor: { x: entity.x, y: entity.y },
      ...(entity.direction ? { direction: entity.direction } : {}),
    },
    definition.footprint,
  ).every(
    (cell) =>
      cell.x >= 0 &&
      cell.y >= 0 &&
      cell.x < level.width &&
      cell.y < level.height,
  );
}
