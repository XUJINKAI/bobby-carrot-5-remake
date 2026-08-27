import { EntityTypeId } from "@bobby/model";
import { LegacyObject, LegacyTerrain } from "./dat/semantic-ids.mjs";

const directTerrainTypes = new Set([
  LegacyTerrain.WATER,
  LegacyTerrain.WATER_ANIMATED,
  LegacyTerrain.WATER_VARIANT_1,
  LegacyTerrain.WATER_VARIANT_2,
  LegacyTerrain.WATER_VARIANT_3,
  LegacyTerrain.GROUND_A,
  LegacyTerrain.GROUND_B,
  LegacyTerrain.GROUND_C,
  LegacyTerrain.GROUND_D,
  LegacyTerrain.SHOVEL_CLEARED_GROUND,
  LegacyTerrain.ICE,
  LegacyTerrain.START,
  LegacyTerrain.EXIT,
  LegacyTerrain.SHOP_DREAM,
  LegacyTerrain.SHOP_CLOUD9,
  LegacyTerrain.SHOP_SUPER_KEY,
  LegacyTerrain.SHOP_STEREO,
  LegacyTerrain.SHOP_MUSIC,
  LegacyTerrain.SHOP_SPEED_SHOES,
  LegacyTerrain.SHOP_COIN_RADAR,
  LegacyTerrain.SHOP_UNAVAILABLE,
  LegacyTerrain.SHOVEL_PICKUP,
  LegacyTerrain.MOWER_PARKING,
]);

const internalObjectParts = new Set([
  LegacyObject.DRAGON_BODY,
  LegacyObject.DRAGON_TAIL,
  LegacyObject.SANDMAN_BODY,
  LegacyObject.DREAM_MACHINE_BODY,
  LegacyObject.BEAVER_BODY,
]);

const directObjectTypes = new Set([
  LegacyObject.CONSUMED_CARROT,
  LegacyObject.CARROT,
  LegacyObject.EGG_NEST_EMPTY,
  LegacyObject.EGG_NEST_FILLED,
  LegacyObject.LOCK,
  LegacyObject.BEANSTALK_TIP,
  LegacyObject.BEAN,
  LegacyObject.WINDMILL_UP,
  LegacyObject.WINDMILL_DOWN,
  LegacyObject.WINDMILL_LEFT,
  LegacyObject.WINDMILL_RIGHT,
  LegacyObject.PLANK,
  LegacyObject.PLANK_CRUMBLING,
  LegacyObject.PLANK_FRAGMENT,
  LegacyObject.SANDMAN,
  LegacyObject.DREAM_MACHINE,
  LegacyObject.MOWER,
  LegacyObject.GAS,
  LegacyObject.BEANSTALK_MID,
  LegacyObject.BEAN_FIELD,
  LegacyObject.CLOUD_RED,
  LegacyObject.CLOUD_PURPLE,
  LegacyObject.CLOUD_GREEN,
  LegacyObject.CRUMBLY_ROCK,
  LegacyObject.BEANSTALK_BASE,
  LegacyObject.BEAN_SPROUT,
  LegacyObject.CLOUD_GRID_RED,
  LegacyObject.CLOUD_GRID_PURPLE,
  LegacyObject.CLOUD_GRID_GREEN,
  LegacyObject.KITE,
  LegacyObject.WHIRLWIND,
  LegacyObject.LANDING,
  LegacyObject.GOLDEN_CARROT,
  LegacyObject.BONUS_COIN,
  LegacyObject.FENCE_1,
  LegacyObject.FENCE_2,
  LegacyObject.FENCE_3,
  LegacyObject.FENCE_4,
  LegacyObject.FENCE_5,
  LegacyObject.FENCE_6,
]);

export function adaptLegacyMap(map, options = {}) {
  const entities = [];
  const starts = [];

  for (let y = 0; y < map.height; y += 1) {
    const row = map.terrain[y];
    if (!row || row.length !== map.width)
      throw new Error(`Legacy terrain row ${y} does not match width ${map.width}`);
    for (let x = 0; x < map.width; x += 1) {
      const type = row[x];
      if (type === LegacyTerrain.START) starts.push({ x, y });
      entities.push(...adaptLegacyTerrain(type, x, y));
    }
  }

  if (starts.length !== 1)
    throw new Error(`Original map must contain exactly one Start terrain, got ${starts.length}`);
  const start = starts[0];
  entities.push({
    type: EntityTypeId.BOBBY,
    x: start.x,
    y: start.y,
    direction: options.bobbyDirection ?? "down",
  });

  for (const object of map.objects ?? [])
    entities.push(...adaptLegacyObject(object));

  return {
    width: map.width,
    height: map.height,
    entities,
  };
}

export function adaptLegacyTerrain(type, x, y) {
  if (type === LegacyTerrain.SNOW)
    return [entity(EntityTypeId.GROUND_D, x, y), entity(EntityTypeId.SNOW, x, y)];
  if (
    type === LegacyTerrain.HIGH_GRASS ||
    type === LegacyTerrain.HIGH_GRASS_OBJECTIVE
  )
    return [
      entity(mowedGroundAt(x, y), x, y),
      entity(type, x, y),
    ];

  const tide = directionSuffix(type, "tide-");
  if (tide) return [entity(EntityTypeId.TIDE, x, y, { direction: tide })];
  const speed = directionSuffix(type, "speed-");
  if (speed) return [entity(EntityTypeId.SPEED, x, y, { direction: speed })];

  const switchState = foldedPressedSwitch(type);
  if (switchState)
    return [
      entity(switchState.type, x, y, {
        state: { pressed: switchState.pressed },
      }),
    ];

  const wind = /^wind-switch-([0-3])-(on|off)$/.exec(type);
  if (wind)
    return [
      entity(EntityTypeId.WIND_SWITCH, x, y, {
        properties: { channel: Number(wind[1]) },
        state: { active: wind[2] === "on" },
      }),
    ];

  const trap = /^trap-(active|inactive)$/.exec(type);
  if (trap)
    return [
      entity(EntityTypeId.TRAP, x, y, {
        state: { active: trap[1] === "active" },
      }),
    ];

  const mirror = /^mirror-([1-4])$/.exec(type);
  if (mirror)
    return [
      entity(EntityTypeId.MIRROR, x, y, {
        state: { variant: Number(mirror[1]) },
      }),
    ];

  const carousel = /^carousel-(1|2|3|4|vertical|horizontal)$/.exec(type);
  if (carousel)
    return [
      entity(EntityTypeId.CAROUSEL, x, y, {
        state: {
          variant: /^\d$/.test(carousel[1])
            ? Number(carousel[1])
            : carousel[1],
        },
      }),
    ];

  const colorBlock = /^(color-(?:yellow|pink)-block)-(raised|lowered)$/.exec(type);
  if (colorBlock)
    return [
      entity(colorBlock[1], x, y, {
        state: { raised: colorBlock[2] === "raised" },
      }),
    ];

  if (directTerrainTypes.has(type) || isLegacyTerrainVariant(type))
    return [entity(type, x, y)];
  throw new Error(`Unsupported legacy terrain type: ${type}`);
}

export function adaptLegacyObject(object) {
  const { type, x, y } = object;
  if (type === LegacyObject.EMPTY || internalObjectParts.has(type)) return [];

  if (
    type === LegacyObject.DRAGON_HEAD_BASE ||
    type === LegacyObject.DRAGON_ANIM_1 ||
    type === LegacyObject.DRAGON_ANIM_2
  )
    return [entity(EntityTypeId.DRAGON, x, y, copiedFields(object))];
  if (type === LegacyObject.BEAVER_BASE)
    return [entity(EntityTypeId.BEAVER, x, y, copiedFields(object))];

  const melt = /^ice-melt-([1-3])$/.exec(type);
  if (type === LegacyObject.ICE_BLOCK || melt)
    return [
      entity(EntityTypeId.ICE_BLOCK, x, y, {
        ...copiedFields(object),
        ...(melt
          ? {
              state: {
                ...(object.state ?? {}),
                meltStage: Number(melt[1]),
              },
            }
          : {}),
      }),
    ];

  if (directObjectTypes.has(type) || /^object-variant-\d{3}$/.test(type))
    return [entity(type, x, y, copiedFields(object))];
  throw new Error(`Unsupported legacy object type: ${type}`);
}

export function mowedGroundAt(x, y) {
  return [
    EntityTypeId.GROUND_A,
    EntityTypeId.GROUND_B,
    EntityTypeId.GROUND_C,
    EntityTypeId.GROUND_D,
  ][(x * 17 + y * 31) & 3];
}

function foldedPressedSwitch(type) {
  const match = /^(speed-switch|tide-switch|carousel-switch|color-yellow-switch|color-pink-switch)-(raised|pressed)$/.exec(
    type,
  );
  if (!match) return null;
  return { type: match[1], pressed: match[2] === "pressed" };
}

function directionSuffix(type, prefix) {
  if (!type.startsWith(prefix)) return null;
  const direction = type.slice(prefix.length);
  return ["up", "down", "left", "right"].includes(direction)
    ? direction
    : null;
}

function isLegacyTerrainVariant(type) {
  return (
    /^walkable-variant-\d{2}$/.test(type) ||
    /^background-variant-\d{3}$/.test(type)
  );
}

function copiedFields(object) {
  return {
    ...(object.direction ? { direction: object.direction } : {}),
    ...(object.properties ? { properties: { ...object.properties } } : {}),
    ...(object.traits ? { traits: [...object.traits] } : {}),
    ...(object.state ? { state: { ...object.state } } : {}),
  };
}

function entity(type, x, y, extra = {}) {
  return { type, x, y, ...extra };
}
