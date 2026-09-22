import { MapEntityTypeId } from "@bobby/model";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";

/** 地面提供生长基底；垂直占用由各对象 Definition 自己声明。 */
export function beanCanGrowAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
): boolean {
  if (!query.inBounds(cell)) return false;
  const presences = query.allPresencesAt(cell);
  return presences.some((presence) =>
    presence.facts.includes("growth-substrate")
  ) && !presences.some((presence) =>
    presence.facts.includes("vertical-occupant")
  );
}
