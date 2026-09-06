import type { EntityCatalog } from "@bobby/engine";
import { EntityTypeId, type WinCondition } from "@bobby/model";
import type { EditorCommand } from "../document/commands.js";
import { normalizeEditorLevel } from "../level/editorLevel.js";
import type { EditorMap } from "../level/types.js";

export type EditorRuleKind = "carrots" | "eggs" | "pushbox" | "exit";

export interface EditorRuleCapability {
  kind: EditorRuleKind;
  available: boolean;
  enabled: boolean;
}

const RULE_ORDER: readonly EditorRuleKind[] = [
  "carrots",
  "eggs",
  "pushbox",
  "exit",
];

export function inspectEditorRules(
  map: EditorMap,
  catalog: EntityCatalog,
): readonly EditorRuleCapability[] {
  const conditions = winConditions(map.rules?.win);
  const availability: Record<EditorRuleKind, boolean> = {
    carrots: map.entities.some((entity) => entity.type === EntityTypeId.CARROT),
    eggs: map.entities.some((entity) => hasSelector(entity, "egg-nest", catalog)),
    pushbox:
      map.entities.some((entity) => hasSelector(entity, "pushable", catalog)) &&
      map.entities.some((entity) => hasSelector(entity, "push-goal", catalog)),
    exit: map.entities.some((entity) => hasSelector(entity, EntityTypeId.EXIT, catalog)),
  };
  return RULE_ORDER.map((kind) => ({
    kind,
    available: availability[kind],
    enabled: conditions.some((condition) => matchesRule(kind, condition)),
  }));
}

export function updateEditorRule(
  catalog: EntityCatalog,
  kind: EditorRuleKind,
  enabled: boolean,
): EditorCommand {
  return {
    apply(map) {
      const capabilities = inspectEditorRules(map, catalog);
      const enabledKinds = new Set(
        capabilities
          .filter((item) => item.available && item.enabled)
          .map((item) => item.kind),
      );
      if (enabled) enabledKinds.add(kind);
      else enabledKinds.delete(kind);
      const conditions = RULE_ORDER
        .filter((candidate) => enabledKinds.has(candidate))
        .map(ruleCondition);
      const rules = { ...(map.rules ?? {}) };
      if (conditions.length > 0)
        rules.win = { type: "all", conditions };
      else delete rules.win;
      return normalizeEditorLevel({ ...map, rules });
    },
  };
}

function winConditions(condition: WinCondition | undefined): readonly WinCondition[] {
  if (!condition) return [];
  return condition.type === "all" ? condition.conditions : [condition];
}

function ruleCondition(kind: EditorRuleKind): WinCondition {
  switch (kind) {
    case "carrots":
      return { type: "collect-all", target: EntityTypeId.CARROT };
    case "eggs":
      return { type: "fill-all", target: "egg-nest", filler: "egg" };
    case "pushbox":
      return { type: "fill-all", target: "push-goal", filler: "pushable" };
    case "exit":
      return { type: "reach", target: EntityTypeId.EXIT };
  }
}

function matchesRule(kind: EditorRuleKind, condition: WinCondition): boolean {
  switch (kind) {
    case "carrots":
      return condition.type === "collect-all" && condition.target === EntityTypeId.CARROT;
    case "eggs":
      return condition.type === "fill-all" && condition.target === "egg-nest" && condition.filler === "egg";
    case "pushbox":
      return condition.type === "fill-all" && condition.target === "push-goal" && condition.filler === "pushable";
    case "exit":
      return condition.type === "reach" && condition.target === EntityTypeId.EXIT;
  }
}

function hasSelector(
  entity: Readonly<EditorMap["entities"][number]>,
  selector: string,
  catalog: EntityCatalog,
): boolean {
  if (entity.type === selector) return true;
  return catalog.has(entity.type) && catalog.require(entity.type).traits.includes(selector);
}
