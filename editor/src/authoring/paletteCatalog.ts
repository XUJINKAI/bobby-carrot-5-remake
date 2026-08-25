import {
  ObjectId,
  terrainDefinitions,
  objectDefinitions,
  getObjectDefinition,
  getTerrainDefinition,
  isObjectAuthorable,
  isObjectLayoutPart,
  type ObjectType,
  type TerrainType,
} from "@bobby/engine";
import type { EditorLevel } from "../level/types.js";

export interface TerrainPaletteItem {
  kind: "terrain";
  type: TerrainType;
}

export interface ObjectPaletteItem {
  kind: "object";
  type: ObjectType;
}

export type PaletteItem = TerrainPaletteItem | ObjectPaletteItem;

export const GROUP_ORDER = [
  "地面",
  "水域",
  "障碍物",
  "机关",
  "目标与标记",
  "道具",
  "载具与动态",
  "角色与大型对象",
  "其他",
] as const;
export type PaletteGroup = (typeof GROUP_ORDER)[number];

export function paletteItems(level: EditorLevel): PaletteItem[] {
  const terrain = new Set<TerrainType>(terrainDefinitions().filter((definition) => definition.authoring?.palette).map((definition) => definition.id));
  const objects = new Set<ObjectType>(objectDefinitions().filter((definition) => definition.authoring?.palette).map((definition) => definition.id));
  for (const row of level.terrain) for (const type of row) terrain.add(type);
  for (const object of level.objects) objects.add(object.type);
  return [
    ...[...terrain].map((type) => ({ kind: "terrain" as const, type })),
    ...[...objects]
      .filter(
        (type) =>
          type !== ObjectId.EMPTY &&
          !isObjectLayoutPart(type) &&
          isObjectAuthorable(type),
      )
      .map((type) => ({ kind: "object" as const, type })),
  ];
}

export function paletteGroup(item: PaletteItem): PaletteGroup {
  const definition =
    item.kind === "terrain"
      ? getTerrainDefinition(item.type)
      : getObjectDefinition(item.type);
  const category = definition.presentation.category;
  const id = item.type;
  if (item.kind === "terrain") {
    if (category === "water" || id.includes("water") || id.startsWith("tide-"))
      return "水域";
    if (id === "start" || id === "exit" || id.includes("objective"))
      return "目标与标记";
    if (
      id.includes("switch") ||
      id.includes("trap") ||
      id.includes("mirror") ||
      id.includes("speed") ||
      id.includes("carousel")
    )
      return "机关";
    if (id.includes("shop") || id.includes("pickup")) return "道具";
    return "地面";
  }
  if (id.includes("carrot") || id.includes("egg-nest")) return "目标与标记";
  if (["bean", "gas", "kite", "bonus-coin", "golden-carrot"].includes(id))
    return "道具";
  if (
    id.includes("cloud") ||
    ["leaf", "mower", "whirlwind", "landing"].includes(id)
  )
    return "载具与动态";
  if (
    id.includes("dragon") ||
    id.includes("beaver") ||
    id.includes("sandman") ||
    id.includes("dream-machine")
  )
    return "角色与大型对象";
  if (
    definition.traits.includes("blocking") ||
    id.includes("fence") ||
    id.includes("rock") ||
    id.includes("ice-block")
  )
    return "障碍物";
  if (
    id.includes("windmill") ||
    id.includes("plank") ||
    id.includes("beanstalk")
  )
    return "机关";
  return "其他";
}

export function paletteLabel(item: PaletteItem): string {
  return (
    item.kind === "terrain"
      ? getTerrainDefinition(item.type)
      : getObjectDefinition(item.type)
  ).presentation.name;
}
