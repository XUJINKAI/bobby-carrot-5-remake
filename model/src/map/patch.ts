import type { JsonPrimitive } from "../shared/json.js";
import type { EntityType, LevelEntity, LevelMap } from "./document.js";

export interface LevelEntitySelector {
  type?: EntityType;
  x?: number;
  y?: number;
}

export type LevelPatch =
  | {
      operation: "add";
      entity: LevelEntity;
    }
  | {
      operation: "remove";
      selector: LevelEntitySelector;
    }
  | {
      operation: "set-fields";
      selector: LevelEntitySelector;
      fields: Record<string, JsonPrimitive>;
    }
  | {
      operation: "replace-type";
      selector: LevelEntitySelector;
      type: EntityType;
    };

const RESERVED_FIELDS = new Set(["type", "x", "y", "stackOrder"]);

/** 在 clone 上应用声明式补丁，调用方持有的基础地图保持不变。 */
export function applyLevelPatches(
  level: LevelMap,
  patches: readonly LevelPatch[] = [],
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
        (entity) => !matchesLevelEntity(entity, patch.selector),
      );
      continue;
    }

    if (patch.operation === "replace-type") {
      result.entities = result.entities.map((entity) => {
        if (!matchesLevelEntity(entity, patch.selector)) return entity;
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
        throw new Error(`LevelPatch 不能覆盖 LevelEntity 保留字段：${key}`);
    }
    for (const entity of result.entities) {
      if (matchesLevelEntity(entity, patch.selector))
        Object.assign(entity, patch.fields);
    }
  }
  return result;
}

export function matchesLevelEntity(
  entity: Pick<LevelEntity, "type" | "x" | "y">,
  selector: LevelEntitySelector,
): boolean {
  return (
    (selector.x === undefined || entity.x === selector.x) &&
    (selector.y === undefined || entity.y === selector.y) &&
    (selector.type === undefined || entity.type === selector.type)
  );
}

function assertSelector(selector: LevelEntitySelector): void {
  if (
    selector.x === undefined &&
    selector.y === undefined &&
    selector.type === undefined
  ) {
    throw new Error("LevelPatch Entity selector 至少需要 x / y / type 中的一项");
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
      `LevelPatch 新增 Entity 超出地图：${entity.type}@${entity.x},${entity.y}`,
    );
  }
}
