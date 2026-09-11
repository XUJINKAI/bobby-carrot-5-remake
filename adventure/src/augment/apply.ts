import type { LevelEntity, LevelMap } from "@bobby/model";
import type {
  AdventureEntitySelector,
  AdventureLevelPatch,
} from "./types.js";

const RESERVED_FIELDS = new Set(["type", "x", "y", "stackOrder"]);

/**
 * Adventure 在 LevelMap 进入 Engine 前执行声明式补丁，基础地图始终保持不变。
 * 补丁只操作公开 LevelEntity，不携带 Original DAT provenance。
 */
export function augmentAdventureLevel(
  level: LevelMap,
  patches: readonly AdventureLevelPatch[] = [],
): LevelMap {
  const result = structuredClone(level);
  for (const patch of patches) {
    if (patch.operation === "add") {
      assertEntityInsideLevel(result, patch.entity);
      result.entities.push(structuredClone(patch.entity));
      continue;
    }

    assertSelector(patch.selector);
    if (patch.operation === "remove") {
      result.entities = result.entities.filter(
        (entity) => !matchesEntity(entity, patch.selector),
      );
      continue;
    }

    if (patch.operation === "replace-type") {
      result.entities = result.entities.map((entity) => {
        if (!matchesEntity(entity, patch.selector)) return entity;
        return {
          type: patch.type,
          x: entity.x,
          y: entity.y,
          ...(entity.stackOrder === undefined
            ? {}
            : { stackOrder: entity.stackOrder }),
        };
      });
      continue;
    }

    for (const key of Object.keys(patch.fields)) {
      if (RESERVED_FIELDS.has(key))
        throw new Error(`Adventure 不能覆盖 LevelEntity 保留字段：${key}`);
    }
    for (const entity of result.entities) {
      if (!matchesEntity(entity, patch.selector)) continue;
      Object.assign(entity, patch.fields);
    }
  }
  return result;
}

export function matchesEntity(
  entity: Pick<LevelEntity, "type" | "x" | "y">,
  selector: AdventureEntitySelector,
): boolean {
  return (
    (selector.x === undefined || entity.x === selector.x) &&
    (selector.y === undefined || entity.y === selector.y) &&
    (selector.type === undefined || entity.type === selector.type)
  );
}

function assertSelector(selector: AdventureEntitySelector): void {
  if (
    selector.x === undefined &&
    selector.y === undefined &&
    selector.type === undefined
  ) {
    throw new Error("Adventure Entity selector 至少需要 x / y / type 中的一项");
  }
}

function assertEntityInsideLevel(level: LevelMap, entity: LevelEntity): void {
  if (
    !Number.isInteger(entity.x) ||
    !Number.isInteger(entity.y) ||
    entity.x < 0 ||
    entity.x >= level.width ||
    entity.y < 0 ||
    entity.y >= level.height
  ) {
    throw new Error(
      `Adventure 新增 Entity 超出地图：${entity.type}@${entity.x},${entity.y}`,
    );
  }
}
