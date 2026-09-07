import { validateLevelPlayability } from "@bobby/engine";
import { entityMapDefinition } from "@bobby/model";
import type { LevelValidationIssue } from "../level/types.js";
import type { EditorMapValidator } from "./types.js";

export const registeredEntityTypesValidator: EditorMapValidator = ({
  map,
  catalog,
}) => {
  const issues: LevelValidationIssue[] = [];
  map.entities.forEach((entity, index) => {
    if (catalog.has(entity.type)) return;
    issues.push({
      level: "error",
      message: `Entity #${index + 1} 使用未注册 type：${entity.type}`,
    });
  });
  return issues;
};

export const requiredEntityFieldsValidator: EditorMapValidator = ({ map }) => {
  const issues: LevelValidationIssue[] = [];
  map.entities.forEach((entity, index) => {
    for (const field of entityMapDefinition(entity.type)?.fields ?? []) {
      if (!field.required || entity[field.key] !== undefined) continue;
      issues.push({
        level: "error",
        message: `Entity #${index + 1} (${entity.type}) 缺少必填字段：${field.key}`,
      });
    }
  });
  return issues;
};

export const playerPresenceValidator: EditorMapValidator = ({ map, catalog }) =>
  validateLevelPlayability(map, catalog)
    .filter((warning) => warning.code === "missing-player")
    .map((warning) => ({ level: "warning" as const, message: warning.message }));

export const reachTargetValidator: EditorMapValidator = ({ map, catalog }) =>
  validateLevelPlayability(map, catalog)
    .filter((warning) => warning.code === "missing-reach-target")
    .map((warning) => ({ level: "warning" as const, message: warning.message }));
