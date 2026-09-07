import {
  EntityTypeId,
  MapEntityTypeId,
  SURFACE_SOURCE_MAPPINGS,
  coordinateObjectType,
  coordinateSurfaceType,
  legacyEntityMapAlias,
  surfaceMappingForTs,
} from "@bobby/model";
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
  LegacyObject.BEANSTALK_MID,
  LegacyObject.BEANSTALK_BASE,
  LegacyObject.BEAN_SPROUT,
]);

const legacyFenceTypes = new Set([
  LegacyObject.FENCE_1,
  LegacyObject.FENCE_2,
  LegacyObject.FENCE_3,
  LegacyObject.FENCE_4,
  LegacyObject.FENCE_5,
  LegacyObject.FENCE_6,
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
  LegacyObject.LEAF,
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
]);

const WIND_DIRECTIONS = ["up", "down", "left", "right"];
const canonicalObjectAliases = new Map([
  [LegacyObject.CONSUMED_CARROT, { type: MapEntityTypeId.CARROT }],
  [LegacyObject.EGG_NEST_EMPTY, { type: MapEntityTypeId.EGG_NEST }],
  [LegacyObject.EGG_NEST_FILLED, { type: MapEntityTypeId.EGG_NEST }],
  [LegacyObject.BEANSTALK_TIP, { type: MapEntityTypeId.BEANSTALK }],
  [LegacyObject.WINDMILL_UP, { type: MapEntityTypeId.WINDMILL, direction: "up" }],
  [LegacyObject.WINDMILL_DOWN, { type: MapEntityTypeId.WINDMILL, direction: "down" }],
  [LegacyObject.WINDMILL_LEFT, { type: MapEntityTypeId.WINDMILL, direction: "left" }],
  [LegacyObject.WINDMILL_RIGHT, { type: MapEntityTypeId.WINDMILL, direction: "right" }],
  [LegacyObject.PLANK_CRUMBLING, { type: MapEntityTypeId.PLANK }],
  [LegacyObject.PLANK_FRAGMENT, { type: MapEntityTypeId.PLANK }],
  [LegacyObject.CLOUD_RED, { type: MapEntityTypeId.CLOUD, color: "red" }],
  [LegacyObject.CLOUD_PURPLE, { type: MapEntityTypeId.CLOUD, color: "purple" }],
  [LegacyObject.CLOUD_GREEN, { type: MapEntityTypeId.CLOUD, color: "green" }],
  [LegacyObject.CLOUD_GRID_RED, { type: MapEntityTypeId.CLOUD_PARKING, color: "red" }],
  [LegacyObject.CLOUD_GRID_PURPLE, { type: MapEntityTypeId.CLOUD_PARKING, color: "purple" }],
  [LegacyObject.CLOUD_GRID_GREEN, { type: MapEntityTypeId.CLOUD_PARKING, color: "green" }],
]);

export function adaptLegacyMap(map, options = {}) {
  const entities = [];
  const starts = [];
  const sourceObjects = map.objects ?? [];
  const explicitObjectCells = new Set(
    sourceObjects
      .filter((object) => object.type !== LegacyObject.EMPTY)
      .map((object) => `${object.x},${object.y}`),
  );
  const objectiveType = sourceObjects.some(
    (object) => object.type === LegacyObject.CARROT,
  )
    ? MapEntityTypeId.CARROT
    : MapEntityTypeId.EGG_NEST;
  const composites = collapseCompositeTerrain(map);

  for (let y = 0; y < map.height; y += 1) {
    const row = map.terrain[y];
    if (!row || row.length !== map.width) {
      throw new Error(
        `Legacy terrain row ${y} does not match width ${map.width}`,
      );
    }
    for (let x = 0; x < map.width; x += 1) {
      const type = row[x];
      if (type === LegacyTerrain.START) starts.push({ x, y });
      const coordinate = `${x},${y}`;
      const composite = composites.anchors.get(coordinate);
      if (composite) {
        entities.push(entity(composite.type, x, y, composite.fields ?? {}));
        continue;
      }
      if (composites.consumed.has(coordinate)) continue;
      entities.push(
        ...adaptLegacyTerrain(type, x, y, {
          hiddenObjectiveType:
            type === LegacyTerrain.HIGH_GRASS_OBJECTIVE &&
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
    entities.push(...adaptLegacyObject(object));
  }

  return {
    width: map.width,
    height: map.height,
    entities,
  };
}

export function adaptLegacyTerrain(type, x, y, options = {}) {
  if (type === LegacyTerrain.SNOW) {
    return [
      canonicalTerrainEntity(EntityTypeId.GROUND_D, x, y),
      entity(EntityTypeId.SNOW, x, y),
    ];
  }
  if (
    type === LegacyTerrain.HIGH_GRASS ||
    type === LegacyTerrain.HIGH_GRASS_OBJECTIVE
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
    const direction = WIND_DIRECTIONS[Number(wind[1])];
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
    return [
      entity(EntityTypeId.CAROUSEL, x, y, {
        variant: /^\d$/.test(carousel[1])
          ? Number(carousel[1])
          : carousel[1],
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

  if (directTerrainTypes.has(type) || isLegacyTerrainVariant(type)) {
    return [canonicalTerrainEntity(type, x, y)];
  }
  throw new Error(`Unsupported legacy terrain type: ${type}`);
}

export function adaptLegacyObject(object) {
  const { type, x, y } = object;
  if (type === LegacyObject.EMPTY || internalObjectParts.has(type)) return [];

  if (
    type === LegacyObject.DRAGON_HEAD_BASE ||
    type === LegacyObject.DRAGON_ANIM_1 ||
    type === LegacyObject.DRAGON_ANIM_2
  ) {
    return [
      entity(EntityTypeId.DRAGON, x + 1, y, {
        ...copiedFields(object),
        direction: "left",
      }),
    ];
  }
  if (type === LegacyObject.BEAVER_BASE) {
    return [entity(MapEntityTypeId.BEAVER, x, y)];
  }
  if (legacyFenceTypes.has(type)) {
    const variant = [...legacyFenceTypes].indexOf(type) + 1;
    return [
      entity(MapEntityTypeId.FENCE, x, y, { variant }),
    ];
  }

  const melt = /^ice-melt-([1-3])$/.exec(type);
  if (type === LegacyObject.ICE_BLOCK || melt) {
    return [
      entity(EntityTypeId.ICE_BLOCK, x, y, {
        ...copiedFields(object),
      }),
    ];
  }

  const alias = canonicalObjectAliases.get(type);
  if (alias) return [entity(alias.type, x, y, alias)];

  const variant = /^object-variant-(\d{3})$/.exec(type);
  if (variant) {
    const index = Number(variant[1]) - 1;
    return [
      entity(
        coordinateObjectType(Math.floor(index / 16) + 1, (index % 16) + 1),
        x,
        y,
      ),
    ];
  }
  if (directObjectTypes.has(type)) {
    return [entity(type, x, y, copiedFields(object))];
  }
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
  const alias = legacyEntityMapAlias(type);
  if (!alias?.to) return entity(type, x, y);
  const source = legacyTerrainCoordinate(type);
  if (source && surfaceMappingForTs(source.row, source.column)?.composite) {
    return entity(coordinateSurfaceType(source.row, source.column), x, y);
  }
  return entity(alias.to, x, y, alias.fields ?? {});
}

function collapseCompositeTerrain(map) {
  const anchors = new Map();
  const consumed = new Set();
  const mappings = SURFACE_SOURCE_MAPPINGS.filter(
    (mapping) => mapping.composite,
  );
  for (const mapping of mappings) {
    const anchorSource = mapping.sources[0];
    if (!anchorSource) continue;
    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        const cells = mapping.sources.map((source) => ({
          x: x + source.column - anchorSource.column,
          y: y + source.row - anchorSource.row,
          expected: legacyTerrainTypeForTs(source.row, source.column),
        }));
        if (
          cells.some(
            (cell) =>
              cell.x < 0 ||
              cell.y < 0 ||
              cell.x >= map.width ||
              cell.y >= map.height ||
              map.terrain[cell.y]?.[cell.x] !== cell.expected ||
              consumed.has(`${cell.x},${cell.y}`),
          )
        )
          continue;
        anchors.set(`${x},${y}`, mapping);
        for (const cell of cells) consumed.add(`${cell.x},${cell.y}`);
      }
    }
  }
  return { anchors, consumed };
}

function legacyTerrainCoordinate(type) {
  const background = /^background-variant-(\d{3})$/.exec(type);
  if (background) return coordinateFromByte(Number(background[1]) - 1);
  const walkable = /^walkable-variant-(\d{2})$/.exec(type);
  if (walkable) return coordinateFromByte(0x60 + Number(walkable[1]) - 1);
  return null;
}

function legacyTerrainTypeForTs(row, column) {
  const byte = (row - 1) * 16 + column - 1;
  if (byte >= 0x60 && byte <= 0x93)
    return `walkable-variant-${String(byte - 0x60 + 1).padStart(2, "0")}`;
  return `background-variant-${String(byte + 1).padStart(3, "0")}`;
}

function coordinateFromByte(byte) {
  return { row: Math.floor(byte / 16) + 1, column: (byte % 16) + 1 };
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
  };
}

function entity(type, x, y, extra = {}) {
  return { type, x, y, ...extra };
}
