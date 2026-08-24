import type { LevelObject } from "../data/types.js";
import type { ObjectTouchResult } from "./behaviors.js";
import { getObjectDefinition } from "./definitions.js";

/**
 * 触碰与进入不同：阻挡对象无法进入，但仍可在一次移动尝试中响应交互。
 * 具体结果由 Definition 提供；调用方只把结果翻译成通用 Engine 事件。
 */
export function touchResultForObject(
  object: LevelObject,
): ObjectTouchResult | undefined {
  for (const behavior of getObjectDefinition(object.type).behaviors) {
    const result = behavior.onTouch?.(object);
    if (result) return result;
  }
  return undefined;
}
