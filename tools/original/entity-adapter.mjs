import {
  EntityTypeId,
  MapEntityTypeId,
  parseTsCoordinateLabel,
  surfaceMappingForTs,
} from "@bobby/model";
import { DecodedObject, DecodedTerrain } from "./dat/semantic-ids.mjs";
import {
  decodedAtlasCoordinate,
  decodedObjectSourceSemantic,
  decodedTerrainSourceSemantic,
} from "./dat/mapping.mjs";
import {
  ORIGINAL_ENTITY_CORRESPONDENCE,
  correspondenceByDecoded,
} from "./entity-correspondence.mjs";

const directTerrainTypes = new Set([
  DecodedTerrain.WATER,
  DecodedTerrain.ICE,
  DecodedTerrain.START,
  DecodedTerrain.EXIT,
  DecodedTerrain.SHOP_DREAM,
  DecodedTerrain.SHOP_CLOUD9,
  DecodedTerrain.SHOP_SUPER_KEY,
  DecodedTerrain.SHOP_STEREO,
  DecodedTerrain.SHOP_MUSIC,
  DecodedTerrain.SHOP_SPEED_SHOES,
  DecodedTerrain.SHOP_COIN_RADAR,
  DecodedTerrain.SHOP_EMPTY,
  DecodedTerrain.SHOVEL_PICKUP,
  DecodedTerrain.MOWER_PARKING,
]);

const internalObjectParts = new Set([
  DecodedObject.DRAGON_BODY,
  DecodedObject.DRAGON_TAIL,
  DecodedObject.SANDMAN_BODY,
  DecodedObject.DREAM_MACHINE_BODY,
  DecodedObject.BEAVER_BODY,
  DecodedObject.BEANSTALK_MID,
  DecodedObject.BEANSTALK_BASE,
  DecodedObject.BEAN_SPROUT,
]);

const decodedFenceTypes = new Set(
  ORIGINAL_ENTITY_CORRESPONDENCE.fence.map((item) => item.decoded),
);

const directObjectTypes = new Set([
  DecodedObject.CONSUMED_CARROT,
  DecodedObject.CARROT,
  DecodedObject.EGG_NEST_EMPTY,
  DecodedObject.EGG_NEST_FILLED,
  DecodedObject.LOCK,
  DecodedObject.BEANSTALK_TIP,
  DecodedObject.BEAN,
  DecodedObject.WINDMILL_UP,
  DecodedObject.WINDMILL_DOWN,
  DecodedObject.WINDMILL_LEFT,
  DecodedObject.WINDMILL_RIGHT,
  DecodedObject.PLANK,
  DecodedObject.PLANK_CRUMBLING,
  DecodedObject.PLANK_FRAGMENT,
  DecodedObject.SANDMAN,
  DecodedObject.DREAM_MACHINE,
  DecodedObject.MOWER,
  DecodedObject.GAS,
  DecodedObject.BEANSTALK_MID,
  DecodedObject.BEAN_FIELD,
  DecodedObject.CLOUD_RED,
  DecodedObject.CLOUD_PURPLE,
  DecodedObject.CLOUD_GREEN,
  DecodedObject.LEAF,
  DecodedObject.CRUMBLY_ROCK,
  DecodedObject.BEANSTALK_BASE,
  DecodedObject.BEAN_SPROUT,
  DecodedObject.CLOUD_GRID_RED,
  DecodedObject.CLOUD_GRID_PURPLE,
  DecodedObject.CLOUD_GRID_GREEN,
  DecodedObject.KITE,
  DecodedObject.WHIRLWIND,
  DecodedObject.LANDING,
  DecodedObject.GOLDEN_CARROT,
  DecodedObject.BONUS_COIN,
]);

const canonicalObjectAliases = new Map([
  [DecodedObject.CONSUMED_CARROT, { type: MapEntityTypeId.CARROT }],
  [DecodedObject.EGG_NEST_EMPTY, { type: MapEntityTypeId.EGG_NEST }],
  [DecodedObject.EGG_NEST_FILLED, { type: MapEntityTypeId.EGG_NEST }],
  [DecodedObject.BEANSTALK_TIP, { type: MapEntityTypeId.BEANSTALK }],
  [DecodedObject.WINDMILL_UP, { type: MapEntityTypeId.WINDMILL, direction: "up" }],
  [DecodedObject.WINDMILL_DOWN, { type: MapEntityTypeId.WINDMILL, direction: "down" }],
  [DecodedObject.WINDMILL_LEFT, { type: MapEntityTypeId.WINDMILL, direction: "left" }],
  [DecodedObject.WINDMILL_RIGHT, { type: MapEntityTypeId.WINDMILL, direction: "right" }],
  [DecodedObject.PLANK_CRUMBLING, { type: MapEntityTypeId.PLANK }],
  [DecodedObject.PLANK_FRAGMENT, { type: MapEntityTypeId.PLANK }],
  [DecodedObject.CLOUD_RED, { type: MapEntityTypeId.CLOUD, color: "red" }],
  [DecodedObject.CLOUD_PURPLE, { type: MapEntityTypeId.CLOUD, color: "purple" }],
  [DecodedObject.CLOUD_GREEN, { type: MapEntityTypeId.CLOUD, color: "green" }],
  [DecodedObject.CLOUD_GRID_RED, { type: MapEntityTypeId.CLOUD_PARKING, color: "red" }],
  [DecodedObject.CLOUD_GRID_PURPLE, { type: MapEntityTypeId.CLOUD_PARKING, color: "purple" }],
  [DecodedObject.CLOUD_GRID_GREEN, { type: MapEntityTypeId.CLOUD_PARKING, color: "green" }],
]);

export function adaptDecodedMap(map, options = {}) {
  const entities = [];
  const starts = [];
  const sourceObjects = map.objects ?? [];
  const explicitObjectCells = new Set(
    sourceObjects
      .filter(
        (object) =>
          decodedObjectSourceSemantic(object.type) !== DecodedObject.EMPTY,
      )
      .map((object) => `${object.x},${object.y}`),
  );
  const objectiveType = sourceObjects.some(
    (object) =>
      decodedObjectSourceSemantic(object.type) === DecodedObject.CARROT,
  )
    ? MapEntityTypeId.CARROT
    : MapEntityTypeId.EGG_NEST;
  for (let y = 0; y < map.height; y += 1) {
    const row = map.terrain[y];
    if (!row || row.length !== map.width) {
      throw new Error(
        `Decoded terrain row ${y} does not match width ${map.width}`,
      );
    }
    for (let x = 0; x < map.width; x += 1) {
      const type = row[x];
      const semanticType = decodedTerrainSourceSemantic(type);
      if (semanticType === DecodedTerrain.START) starts.push({ x, y });
      entities.push(
        ...adaptDecodedTerrain(type, x, y, {
          hiddenObjectiveType:
            semanticType === DecodedTerrain.HIGH_GRASS_OBJECTIVE &&
            !explicitObjectCells.has(`${x},${y}`)
              ? objectiveType
              : null,
        }),
      );
    }
  }

  if (starts.length !== 1) {
    throw new Error(
      `Original map must contain exactly one Start terrain, got ${starts.length}`,
    );
  }
  const start = starts[0];
  entities.push({
    type: EntityTypeId.BOBBY,
    x: start.x,
    y: start.y,
  });

  for (const object of sourceObjects) {
    entities.push(...adaptDecodedObject(object));
  }

  return {
    width: map.width,
    height: map.height,
    entities,
  };
}

export function adaptDecodedTerrain(type, x, y, options = {}) {
  const coordinateType = decodedAtlasCoordinate(type);
  type = decodedTerrainSourceSemantic(type);
  if (type === DecodedTerrain.SNOW) {
    return [
      entity(MapEntityTypeId.GRASS, x, y, { variant: "ts-10-2" }),
      entity(EntityTypeId.SNOW, x, y),
    ];
  }
  if (
    type === DecodedTerrain.HIGH_GRASS ||
    type === DecodedTerrain.HIGH_GRASS_OBJECTIVE
  ) {
    return [
      canonicalTerrainEntity(mowedGroundAt(x, y), x, y),
      ...(options.hiddenObjectiveType
        ? [entity(options.hiddenObjectiveType, x, y)]
        : []),
      entity(MapEntityTypeId.HIGH_GRASS, x, y),
    ];
  }

  const tide = directionSuffix(type, "tide-");
  if (tide) return [entity(EntityTypeId.TIDE, x, y, { direction: tide })];
  const speed = directionSuffix(type, "speed-");
  if (speed) return [entity(EntityTypeId.SPEED, x, y, { direction: speed })];

  const switchState = foldedPressedSwitch(type);
  if (switchState) {
    return [
      entity(switchState.type, x, y, {
        ...(switchState.color ? { color: switchState.color } : {}),
        ...(switchState.pressed ? { pressed: true } : {}),
      }),
    ];
  }

  const wind = /^wind-switch-([0-3])-(on|off)$/.exec(type);
  if (wind) {
    const direction = ORIGINAL_ENTITY_CORRESPONDENCE.windSwitch.find(
      (item) => item.channel === Number(wind[1]),
    )?.direction;
    return [
      entity(EntityTypeId.WIND_SWITCH, x, y, {
        direction,
        ...(wind[2] === "on" ? { active: true } : {}),
      }),
    ];
  }

  const trap = /^trap-(active|inactive)$/.exec(type);
  if (trap) {
    return [
      entity(EntityTypeId.TRAP, x, y, {
        ...(trap[1] === "inactive" ? { active: false } : {}),
      }),
    ];
  }

  const mirror = /^mirror-([1-4])$/.exec(type);
  if (mirror) {
    return [
      entity(EntityTypeId.MIRROR, x, y, {
        variant: Number(mirror[1]),
      }),
    ];
  }

  const carousel = /^carousel-(1|2|3|4|vertical|horizontal)$/.exec(type);
  if (carousel) {
    const correspondence = correspondenceByDecoded("carousel", type);
    if (!correspondence)
      throw new Error(`Carousel decoded identity 未登记：${type}`);
    return [
      entity(EntityTypeId.CAROUSEL, x, y, {
        variant: correspondence.variant,
      }),
    ];
  }

  const colorBlock = /^(color-(?:yellow|pink)-block)-(raised|lowered)$/.exec(
    type,
  );
  if (colorBlock) {
    return [
      entity(MapEntityTypeId.COLOR_BLOCK, x, y, {
        color: colorBlock[1].includes("pink") ? "pink" : "yellow",
        ...(colorBlock[2] === "lowered" ? { raised: false } : {}),
      }),
    ];
  }

  if (directTerrainTypes.has(type)) return [entity(type, x, y)];
  if (coordinateType) {
    return [canonicalTerrainEntity(coordinateType, x, y)];
  }
  throw new Error(`Unsupported decoded terrain type: ${type}`);
}

export function adaptDecodedObject(object) {
  const { x, y } = object;
  const type = decodedObjectSourceSemantic(object.type);
  if (type === DecodedObject.EMPTY || internalObjectParts.has(type)) return [];

  if (
    type === DecodedObject.DRAGON_HEAD_BASE ||
    type === DecodedObject.DRAGON_ANIM_1 ||
    type === DecodedObject.DRAGON_ANIM_2
  ) {
    return [
      entity(EntityTypeId.DRAGON, x + 1, y, {
        ...copiedFields(object),
        direction: "left",
      }),
    ];
  }
  if (type === DecodedObject.BEAVER_BASE) {
    return [entity(MapEntityTypeId.BEAVER, x, y)];
  }
  if (decodedFenceTypes.has(type)) {
    const variant = correspondenceByDecoded("fence", type)?.variant;
    if (!variant) throw new Error(`Fence decoded identity 未登记：${type}`);
    return [
      entity(MapEntityTypeId.FENCE, x, y, { variant }),
    ];
  }

  const melt = /^ice-melt-([1-3])$/.exec(type);
  if (type === DecodedObject.ICE_BLOCK || melt) {
    return [
      entity(EntityTypeId.ICE_BLOCK, x, y, {
        ...copiedFields(object),
      }),
    ];
  }

  const alias = canonicalObjectAliases.get(type);
  if (alias) return [entity(alias.type, x, y, alias)];

  if (directObjectTypes.has(type)) {
    return [entity(type, x, y, copiedFields(object))];
  }

  throw new Error(`Unsupported decoded object type: ${type}`);
}

export function mowedGroundAt(x, y) {
  return [
    "ts-6-15",
    "ts-6-16",
    "ts-10-1",
    "ts-10-2",
  ][(x * 17 + y * 31) & 3];
}

function foldedPressedSwitch(type) {
  const match = /^(speed-switch|tide-switch|carousel-switch|color-yellow-switch|color-pink-switch)-(raised|pressed)$/.exec(
    type,
  );
  if (!match) return null;
  const color = match[1].startsWith("color-")
    ? match[1].includes("pink")
      ? "pink"
      : "yellow"
    : undefined;
  return {
    type: color ? MapEntityTypeId.COLOR_SWITCH : match[1],
    pressed: match[2] === "pressed",
    ...(color ? { color } : {}),
  };
}

function canonicalTerrainEntity(type, x, y) {
  const coordinate = parseTsCoordinateLabel(type);
  if (!coordinate) return entity(type, x, y);
  const mapping = surfaceMappingForTs(coordinate.row, coordinate.column);
  return mapping
    ? entity(mapping.type, x, y, mapping.fields ?? {})
    : entity(MapEntityTypeId.SURFACE, x, y, { variant: type });
}

function directionSuffix(type, prefix) {
  if (!type.startsWith(prefix)) return null;
  const direction = type.slice(prefix.length);
  return ["up", "down", "left", "right"].includes(direction)
    ? direction
    : null;
}

function copiedFields(object) {
  return {
    ...(object.direction ? { direction: object.direction } : {}),
  };
}

function entity(type, x, y, extra = {}) {
  return { type, x, y, ...extra };
}
