import { surfaceMappingForEntity, type LevelEntity } from "@bobby/model";
import {
  instantiateLevelEntity,
  type EntityId,
  type EntityInstance,
} from "../../world/entity/EntityInstance.js";
import { originalSurfaceFacts } from "./surface-facts.js";

/** 原版 Surface 的实例语义在具体对象层初始化。 */
export function initializeOriginalLevelEntity(
  id: EntityId,
  source: LevelEntity,
): EntityInstance {
  const mapping = surfaceMappingForEntity(source.type, source);
  return instantiateLevelEntity(
    id,
    source,
    mapping ? originalSurfaceFacts(mapping) : [],
  );
}
