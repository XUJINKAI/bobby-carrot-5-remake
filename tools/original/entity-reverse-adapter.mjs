import {
  ENTITY_MAP_MIGRATION_ALIASES,
  EntityTypeId,
  MapEntityTypeId,
  SURFACE_SOURCE_MAPPINGS,
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
const specialObjectTypes = new Set([
  LegacyObject.EMPTY,
  LegacyObject.DRAGON_HEAD_BASE,
  LegacyObject.DRAGON_BODY,
  LegacyObject.DRAGON_TAIL,
  LegacyObject.DRAGON_ANIM_1,
  LegacyObject.DRAGON_ANIM_2,
  LegacyObject.BEAVER_BASE,
  LegacyObject.BEAVER_BODY,
  LegacyObject.ICE_BLOCK,
  LegacyObject.ICE_MELT_1,
  LegacyObject.ICE_MELT_2,
  LegacyObject.ICE_MELT_3,
  LegacyObject.FENCE_1,
  LegacyObject.FENCE_2,
  LegacyObject.FENCE_3,
  LegacyObject.FENCE_4,
  LegacyObject.FENCE_5,
  LegacyObject.FENCE_6,
]);
const directObjectTypes = new Set(
  Object.values(LegacyObject).filter((type) => !specialObjectTypes.has(type)),
);
const WIND_DIRECTION_INDEX = {
  up: 0,
  down: 1,
  left: 2,
  right: 3,
};

/** 将产品 Entity Map 还原为 DAT 编码器专用的 legacy terrain/object 表示。 */
export function reverseEntityMap(map) {
  validateMapShape(map);
  const cells = Array.from({ length: map.height }, () =>
    Array.from({ length: map.width }, () => []),
  );
  for (const entity of map.entities) {
    cells[entity.y][entity.x].push(entity);
  }
  const terrain = cells.map((row, y) =>
    row.map((entities, x) => terrainAt(entities, x, y)),
  );
  validateBobbyStartPair(map.entities);
  return {
    width: map.width,
    height: map.height,
    terrain,
    objects: map.entities.flatMap((entity) => objectFor(entity)),
  };
}

function validateMapShape(map) {
  if (!map || typeof map !== "object" || map.schemaVersion !== 1) {
    throw new Error("Patch map 必须是 schemaVersion: 1 的 Entity Map");
  }
  if (!Number.isInteger(map.width) || !Number.isInteger(map.height)) {
    throw new Error("Patch map 的 width 与 height 必须是整数");
  }
  if (
    map.width < 1 ||
    map.width > 255 ||
    map.height < 1 ||
    map.height > 255
  ) {
    throw new Error("Patch map 尺寸必须在 1 到 255 格之间");
  }
  if (!Array.isArray(map.entities)) {
    throw new Error("Patch map 必须包含 entities 数组");
  }
  for (const [index, entity] of map.entities.entries()) {
    if (!entity || typeof entity.type !== "string") {
      throw new Error(`Patch map entity ${index} 缺少 type`);
    }
    if (
      !Number.isInteger(entity.x) ||
      !Number.isInteger(entity.y) ||
      entity.x < 0 ||
      entity.y < 0 ||
      entity.x >= map.width ||
      entity.y >= map.height
    ) {
      throw new Error(`Patch map entity ${index} 坐标越界`);
    }
  }
}

function terrainAt(entities, x, y) {
  const special = entities
    .filter(
      (entity) =>
        entity.type === EntityTypeId.SNOW ||
        entity.type === EntityTypeId.HIGH_GRASS ||
        entity.type === EntityTypeId.HIGH_GRASS_OBJECTIVE,
    )
    .map(legacyTerrainFor);
  if (special.length === 1) {
    return special[0];
  }
  if (special.length > 1) {
    throw new Error(`Patch map ${x},${y} 包含多个可编码的覆盖地形 Entity`);
  }
  const candidates = entities.map(legacyTerrainFor).filter(Boolean);
  if (candidates.length !== 1)
    throw new Error(
      `Patch map ${x},${y} 必须恰好包含一个可编码的地形 Entity，实际为 ${candidates.length}`,
    );
  return candidates[0];
}

function legacyTerrainFor(entity) {
  const { type } = entity;
  if (type === EntityTypeId.SNOW) return LegacyTerrain.SNOW;
  if (type === EntityTypeId.HIGH_GRASS) return LegacyTerrain.HIGH_GRASS;
  if (type === EntityTypeId.HIGH_GRASS_OBJECTIVE) {
    return LegacyTerrain.HIGH_GRASS_OBJECTIVE;
  }
  if (type === EntityTypeId.TIDE) {
    return directionTerrain("tide", entity.direction);
  }
  if (type === EntityTypeId.SPEED) {
    return directionTerrain("speed", entity.direction);
  }
  if (type === EntityTypeId.SPEED_SWITCH) {
    return pressedTerrain("speed-switch", entity.pressed ?? false);
  }
  if (type === EntityTypeId.TIDE_SWITCH) {
    return pressedTerrain("tide-switch", entity.pressed ?? false);
  }
  if (type === EntityTypeId.CAROUSEL_SWITCH) {
    return pressedTerrain("carousel-switch", entity.pressed ?? false);
  }
  if (type === MapEntityTypeId.COLOR_SWITCH) {
    if (entity.color !== "yellow" && entity.color !== "pink")
      throw new Error("color-switch 的 color 必须是 yellow/pink");
    return pressedTerrain(
      `color-${entity.color}-switch`,
      entity.pressed ?? false,
    );
  }
  if (type === EntityTypeId.COLOR_YELLOW_SWITCH) {
    return pressedTerrain("color-yellow-switch", entity.state?.pressed);
  }
  if (type === EntityTypeId.COLOR_PINK_SWITCH) {
    return pressedTerrain("color-pink-switch", entity.state?.pressed);
  }
  if (type === EntityTypeId.WIND_SWITCH) {
    const channel = WIND_DIRECTION_INDEX[entity.direction];
    if (channel === undefined)
      throw new Error("wind-switch 的 direction 必须是 up/down/left/right");
    return `wind-switch-${channel}-${entity.active === true ? "on" : "off"}`;
  }
  if (type === EntityTypeId.TRAP)
    return `trap-${entity.active === false ? "inactive" : "active"}`;
  if (type === EntityTypeId.MIRROR)
    return variantTerrain("mirror", entity.variant, [1, 2, 3, 4]);
  if (type === EntityTypeId.CAROUSEL)
    return variantTerrain("carousel", entity.variant, [
      1,
      2,
      3,
      4,
      "vertical",
      "horizontal",
    ]);
  if (type === EntityTypeId.COLOR_YELLOW_BLOCK)
    return `color-yellow-block-${entity.state?.raised ? "raised" : "lowered"}`;
  if (type === EntityTypeId.COLOR_PINK_BLOCK)
    return `color-pink-block-${entity.state?.raised ? "raised" : "lowered"}`;
  if (type === MapEntityTypeId.COLOR_BLOCK) {
    if (entity.color !== "yellow" && entity.color !== "pink")
      throw new Error("color-block 的 color 必须是 yellow/pink");
    return `color-${entity.color}-block-${entity.raised === false ? "lowered" : "raised"}`;
  }
  if (
    directTerrainTypes.has(type) ||
    /^walkable-variant-\d{2}$/.test(type) ||
    /^background-variant-\d{3}$/.test(type)
  )
    return type;
  return legacySurfaceTerrain(entity);
}

function legacySurfaceTerrain(entity) {
  let mapping = SURFACE_SOURCE_MAPPINGS.find(
    (candidate) =>
      candidate.type === entity.type &&
      Object.entries(candidate.fields ?? {}).every(
        ([key, value]) => entity[key] === value,
      ),
  );
  if (!mapping) {
    const coordinate = /^surface-(\d+)-(\d+)$/.exec(entity.type);
    if (coordinate) {
      mapping = {
        type: entity.type,
        sources: [
          { row: Number(coordinate[1]), column: Number(coordinate[2]) },
        ],
      };
    }
  }
  if (!mapping) return null;
  if (mapping.composite)
    throw new Error(
      `${entity.type} 是 composite surface，DAT reverse adapter 尚不能从单个 anchor 展开`,
    );
  const source = mapping.sources[0];
  if (!source) return null;
  const alias = ENTITY_MAP_MIGRATION_ALIASES.find(
    (candidate) =>
      candidate.to === entity.type &&
      candidate.from !== "fence" &&
      Object.entries(candidate.fields ?? {}).every(
        ([key, value]) => entity[key] === value,
      ),
  );
  if (alias) return alias.from;
  const byte = (source.row - 1) * 16 + source.column - 1;
  if (byte >= 0x60 && byte <= 0x93)
    return `walkable-variant-${String(byte - 0x60 + 1).padStart(2, "0")}`;
  return `background-variant-${String(byte + 1).padStart(3, "0")}`;
}

function objectFor(entity) {
  const { type, x, y } = entity;
  if (type === EntityTypeId.BOBBY || legacyTerrainFor(entity)) return [];
  if (type === EntityTypeId.DRAGON) {
    if (entity.direction !== "left")
      throw new Error("原版 DAT Dragon 只支持 left direction");
    return [{ type: LegacyObject.DRAGON_HEAD_BASE, x: x - 1, y }];
  }
  if (type === EntityTypeId.BEAVER)
    return [{ type: LegacyObject.BEAVER_BASE, x, y }];
  if (type === EntityTypeId.FENCE)
    return [{ type: LegacyObject.FENCE_1, x, y }];
  if (type === EntityTypeId.ICE_BLOCK) {
    const stage = entity.state?.meltStage;
    const legacyType =
      stage === undefined || stage === 0
        ? LegacyObject.ICE_BLOCK
        : {
            1: LegacyObject.ICE_MELT_1,
            2: LegacyObject.ICE_MELT_2,
            3: LegacyObject.ICE_MELT_3,
          }[stage];
    if (!legacyType)
      throw new Error("ice-block 的 state.meltStage 必须是 1 到 3 的整数");
    return [{ type: legacyType, x, y }];
  }
  if (
    directObjectTypes.has(type) ||
    /^object-variant-\d{3}$/.test(type)
  )
    return [{ type, x, y }];
  throw new Error(`Entity type 无法编码为原版 DAT：${type}`);
}

function validateBobbyStartPair(entities) {
  const bobby = entities.filter((entity) => entity.type === EntityTypeId.BOBBY);
  const starts = entities.filter((entity) => entity.type === EntityTypeId.START);
  if (bobby.length !== 1)
    throw new Error("Patch map 必须恰好包含一个 Bobby Entity");
  if (starts.length !== 1)
    throw new Error("Patch map 必须恰好包含一个 Start Entity");
  if (bobby[0].x !== starts[0].x || bobby[0].y !== starts[0].y)
    throw new Error("Bobby 必须与 Start Entity 位于同一格");
}

function directionTerrain(prefix, direction) {
  if (!["up", "down", "left", "right"].includes(direction))
    throw new Error(`${prefix} Entity 必须使用 up/down/left/right direction`);
  return `${prefix}-${direction}`;
}
function pressedTerrain(prefix, pressed) {
  if (typeof pressed !== "boolean")
    throw new Error(`${prefix} 的 pressed 必须是 boolean`);
  return `${prefix}-${pressed ? "pressed" : "raised"}`;
}
function variantTerrain(prefix, variant, allowed) {
  if (!allowed.includes(variant))
    throw new Error(`${prefix} 的 variant 无法编码为原版 DAT`);
  return `${prefix}-${variant}`;
}
