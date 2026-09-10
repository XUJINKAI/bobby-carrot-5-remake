import {
  levelEntityContractIssues,
  type LevelEntity,
  type LevelMap,
} from "@bobby/model";

export interface RuntimeLevelPreparationOptions {
  ignoredEntityFields?: readonly string[];
}

/** 只降级有实例合同问题的 Entity，其余地图数据保持原样。 */
export function prepareRuntimeLevel(
  level: Readonly<LevelMap>,
  options: RuntimeLevelPreparationOptions = {},
): LevelMap {
  return {
    ...structuredClone(level),
    entities: level.entities.map((entity) =>
      prepareRuntimeEntity(entity, options),
    ),
  };
}

function prepareRuntimeEntity(
  entity: Readonly<LevelEntity>,
  options: RuntimeLevelPreparationOptions,
): LevelEntity {
  const issues = levelEntityContractIssues(
    entity,
    options.ignoredEntityFields
      ? { ignoredFields: options.ignoredEntityFields }
      : {},
  );
  return issues.length === 0
    ? structuredClone(entity)
    : { ...structuredClone(entity), type: `invalid:${entity.type}` };
}
