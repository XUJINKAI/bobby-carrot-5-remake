import { MapEntityTypeId } from "@bobby/model";

const DIALOG_TYPES = new Set<string>([
  MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
  MapEntityTypeId.SHOP_CLOUD9_TICKET,
  MapEntityTypeId.SHOP_STEREO_SYSTEM,
  MapEntityTypeId.SHOP_EXTRA_MUSIC,
  MapEntityTypeId.SHOP_SPEED_SHOES,
  MapEntityTypeId.SHOP_COIN_RADAR,
  MapEntityTypeId.SANDMAN,
  MapEntityTypeId.DREAM_MACHINE,
  MapEntityTypeId.BEAVER,
  MapEntityTypeId.SNOWMAN,
]);

const INTERACTION_TYPES = new Set<string>([
  MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
  MapEntityTypeId.SHOP_CLOUD9_TICKET,
  MapEntityTypeId.SHOP_STEREO_SYSTEM,
  MapEntityTypeId.SHOP_EXTRA_MUSIC,
  MapEntityTypeId.SHOP_SPEED_SHOES,
  MapEntityTypeId.SHOP_COIN_RADAR,
  MapEntityTypeId.SANDMAN,
  MapEntityTypeId.DREAM_MACHINE,
  MapEntityTypeId.BEAVER,
]);

const WATER_TYPES = new Set<string>([
  MapEntityTypeId.TIDE,
  MapEntityTypeId.WATER,
  MapEntityTypeId.WATERFALL,
]);

/** 具体 Entity 显式选用通用机制，注册表无需读取 Entity Type。 */
export function mechanismsForOriginalType(type: string): readonly string[] {
  const ids: string[] = [];
  if (INTERACTION_TYPES.has(type)) ids.push("object-interaction");
  if (DIALOG_TYPES.has(type)) ids.push("dialog");
  if (WATER_TYPES.has(type)) ids.push("water-overlay");
  return ids;
}
