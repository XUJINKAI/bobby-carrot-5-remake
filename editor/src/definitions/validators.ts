import { validateLevelPlayability } from "@bobby/engine";
import { levelEntityContractIssues } from "@bobby/model";
import { materializeSurfaceVariants } from "../authoring/surfacePersistence.js";
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
      level: "warning",
      message: `Entity #${index + 1} 使用未知 type：${entity.type}`,
    });
  });
  return issues;
};

export const requiredEntityFieldsValidator: EditorMapValidator = ({ map }) => {
  const issues: LevelValidationIssue[] = [];
  materializeSurfaceVariants(map).entities.forEach((entity, index) => {
    for (const issue of levelEntityContractIssues(entity))
      issues.push({
        level: "warning",
        message: `Entity #${index + 1} (${entity.type}) ${issue}`,
      });
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
