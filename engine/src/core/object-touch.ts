import type { LevelObject } from "../data/types.js";
import { touchResultForObject } from "../mechanics/interactions.js";
import type { WorldEvent } from "../world/WorldTypes.js";

/** Definition 只描述交互语义；Engine Core 将其翻译成对外统一 WorldEvent。 */
export function worldEventForObjectTouch(
  object: LevelObject,
): WorldEvent | undefined {
  const touch = touchResultForObject(object);
  if (!touch) return undefined;
  if (touch.kind === "dialog")
    return {
      type: "dialog",
      message: "触发对象对白",
      ...(touch.text !== undefined ? { text: touch.text } : {}),
      x: object.x,
      y: object.y,
      objectType: object.type,
    };
  return undefined;
}
