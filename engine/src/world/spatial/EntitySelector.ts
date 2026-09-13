import type { EntityType } from "@bobby/model";
import type { FactId } from "../../mechanism/fact/FactRegistry.js";

/** Engine 内部显式区分对象类型与语义 Fact 的查询条件。 */
export type EntitySelector =
  | { readonly kind: "type"; readonly value: EntityType }
  | { readonly kind: "fact"; readonly value: FactId }
  | { readonly kind: "any"; readonly selectors: readonly EntitySelector[] };

/** LevelMap 的字符串目标沿用 Type 与 Fact 的并集语义。 */
export function levelRuleSelector(value: string): EntitySelector {
  return {
    kind: "any",
    selectors: [
      { kind: "type", value },
      { kind: "fact", value },
    ],
  };
}
