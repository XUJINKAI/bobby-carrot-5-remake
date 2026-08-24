import type { ObjectType } from "../data/types.js";
import type { BehaviorRuntimeContext } from "./behaviors.js";
import { getObjectDefinition } from "./definitions.js";

/**
 * 触碰与进入不同：阻挡对象无法进入，但仍可在一次移动尝试中响应交互。
 * 具体对象行为仍然由 Definition 提供，World 只负责调度。
 */
export function runObjectTouch(
  id: ObjectType,
  context: BehaviorRuntimeContext,
): boolean {
  for (const behavior of getObjectDefinition(id).behaviors)
    if (behavior.onTouch?.(context)?.stop) return true;
  return false;
}
