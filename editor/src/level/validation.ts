import { Terrain } from "@bobby/model";
import { normalizeEditorLevel } from "./editorLevel.js";
import type { EditorLevel, LevelValidationIssue } from "./types.js";

export function validateEditorLevel(
  level: EditorLevel,
): LevelValidationIssue[] {
  const normalized = normalizeEditorLevel(level);
  const issues: LevelValidationIssue[] = [];
  let starts = 0;
  let exits = 0;
  for (const row of normalized.terrain)
    for (const type of row) {
      if (type === Terrain.START) starts++;
      if (type === Terrain.EXIT) exits++;
    }
  if (starts === 0)
    issues.push({
      level: "warning",
      message: "没有 Bobby 出生点；Engine 会使用第一个可步行格作为回退出生点。",
    });
  if (starts > 1)
    issues.push({
      level: "warning",
      message: `存在 ${starts} 个出生点；原版语义只需要一个。`,
    });
  if (exits === 0)
    issues.push({
      level: "warning",
      message: "没有出口，因此地图通常无法正常通关。",
    });
  return issues;
}
