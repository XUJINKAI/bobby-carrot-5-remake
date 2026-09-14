import { goalAvailable, type EntityCatalog } from "@bobby/engine";
import type { GoalType, WinCondition } from "@bobby/model";
import type { EditorCommand } from "../document/commands.js";
import { normalizeEditorLevel } from "../level/editorLevel.js";
import type { EditorMap } from "../level/types.js";
import { EditorPreview } from "./EditorPreview.js";

export type EditorRuleKind = "carrots" | "eggs" | "pushbox" | "exit" | "golden-carrot";

export interface EditorRuleCapability {
  kind: EditorRuleKind;
  available: boolean;
  enabled: boolean;
}

export class EditorRuleDetector {
  private readonly availableKinds = new Set<EditorRuleKind>();

  detect(map: EditorMap, catalog: EntityCatalog): readonly EditorRuleKind[] {
    const capabilities = inspectEditorRules(map, catalog);
    const available = capabilities.filter((item) => item.available);
    const detected = available
      .filter((item) => !this.availableKinds.has(item.kind) && !item.enabled)
      .map((item) => item.kind);
    this.availableKinds.clear();
    for (const item of available) this.availableKinds.add(item.kind);
    return detected;
  }

  reset(): void {
    this.availableKinds.clear();
  }
}

const RULE_ORDER: readonly EditorRuleKind[] = [
  "carrots",
  "eggs",
  "pushbox",
  "exit",
  "golden-carrot",
];

export function inspectEditorRules(
  map: EditorMap,
  catalog: EntityCatalog,
): readonly EditorRuleCapability[] {
  const conditions = winConditions(map.rules?.win);
  const preview = new EditorPreview(map, catalog);
  const available = (type: GoalType) =>
    goalAvailable(type, preview.entities, preview.spatial);
  const availability: Record<EditorRuleKind, boolean> = {
    carrots: available("carrot"),
    eggs: available("egg"),
    pushbox: available("push-goal"),
    exit: available("exit"),
    "golden-carrot": available("golden-carrot"),
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
  return changeEditorRules(catalog, [{ kind, enabled }]);
}

export function enableEditorRules(
  catalog: EntityCatalog,
  kinds: readonly EditorRuleKind[],
): EditorCommand {
  return changeEditorRules(
    catalog,
    kinds.map((kind) => ({ kind, enabled: true })),
  );
}

function changeEditorRules(
  catalog: EntityCatalog,
  changes: readonly { kind: EditorRuleKind; enabled: boolean }[],
): EditorCommand {
  return {
    apply(map) {
      const capabilities = inspectEditorRules(map, catalog);
      const enabledKinds = new Set(
        capabilities
          .filter((item) => item.available && item.enabled)
          .map((item) => item.kind),
      );
      const availableKinds = new Set(
        capabilities.filter((item) => item.available).map((item) => item.kind),
      );
      for (const change of changes) {
        if (change.enabled && availableKinds.has(change.kind))
          enabledKinds.add(change.kind);
        else enabledKinds.delete(change.kind);
      }
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
      return { type: "carrot" };
    case "eggs":
      return { type: "egg" };
    case "pushbox":
      return { type: "push-goal" };
    case "exit":
      return { type: "exit" };
    case "golden-carrot":
      return { type: "golden-carrot" };
  }
}

function matchesRule(kind: EditorRuleKind, condition: WinCondition): boolean {
  switch (kind) {
    case "carrots":
      return condition.type === "carrot";
    case "eggs":
      return condition.type === "egg";
    case "pushbox":
      return condition.type === "push-goal";
    case "exit":
      return condition.type === "exit";
    case "golden-carrot":
      return condition.type === "golden-carrot";
  }
}
