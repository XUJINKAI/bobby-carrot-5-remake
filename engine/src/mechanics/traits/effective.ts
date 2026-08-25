import type { ObjectType } from "../../data/types.js";
import type { TileTrait } from "../definition-types.js";
import { objectHasTrait } from "../definitions.js";

/** 合并 Definition 固有 Trait 与已通过白名单校验的实例 Trait。 */
export function effectiveObjectHasTrait(
  type: ObjectType,
  instanceTraits: readonly string[] | undefined,
  trait: TileTrait,
): boolean {
  return objectHasTrait(type, trait) || instanceTraits?.includes(trait) === true;
}
