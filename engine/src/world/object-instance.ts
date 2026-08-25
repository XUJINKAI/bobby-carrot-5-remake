import type {
  LevelObject,
  LevelObjectProperties,
  LevelObjectTraits,
  ObjectType,
} from "@bobby/model";
import { EMPTY_OBJECT } from "../mechanics/ids.js";

export function runtimeObject(
  type: ObjectType,
  x: number,
  y: number,
  traits: LevelObjectTraits | undefined,
  properties: LevelObjectProperties | undefined,
): LevelObject[] {
  if (type === EMPTY_OBJECT) return [];
  return [{
    type,
    x,
    y,
    ...(traits ? { traits } : {}),
    ...(properties ? { properties } : {}),
  }];
}
