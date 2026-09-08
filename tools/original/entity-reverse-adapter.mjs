import { EntityTypeId, MapEntityTypeId, surfaceMappingForEntity } from "@bobby/model";
import { DecodedObject, DecodedTerrain } from "./dat/semantic-ids.mjs";
import {
  decodeDatObject,
  decodeDatTerrain,
  encodeDatObject,
  encodeDatTerrain,
} from "./dat/mapping.mjs";
import {
  ORIGINAL_ENTITY_CORRESPONDENCE,
  correspondenceByField,
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
const specialObjectTypes = new Set([
  DecodedObject.EMPTY,
  DecodedObject.DRAGON_HEAD_BASE,
  DecodedObject.DRAGON_BODY,
  DecodedObject.DRAGON_TAIL,
  DecodedObject.DRAGON_ANIM_1,
  DecodedObject.DRAGON_ANIM_2,
  DecodedObject.BEAVER_BASE,
  DecodedObject.BEAVER_BODY,
  DecodedObject.ICE_BLOCK,
  DecodedObject.ICE_MELT_1,
  DecodedObject.ICE_MELT_2,
  DecodedObject.ICE_MELT_3,
  ...ORIGINAL_ENTITY_CORRESPONDENCE.fence.map((item) => item.decoded),
]);
const directObjectTypes = new Set(
  Object.values(DecodedObject).filter((type) => !specialObjectTypes.has(type)),
);

/** 将产品 Entity Map 还原为 DAT 编码器专用的 decoded terrain/object 表示。 */
export function reverseEntityMap(map) {
  validateMapShape(map);
  const cells = Array.from({ length: map.height }, () =>
    Array.from({ length: map.width }, () => []),
  );
  for (const entity of map.entities)
    cells[entity.y][entity.x].push(entity);
  const terrain = cells.map((row, y) =>
    row.map((entities, x) => terrainAt(entities, x, y)),
  );
  validateBobbyStartPair(map.entities);
  return {
    width: map.width,
    height: map.height,
    terrain,
    objects: map.entities.flatMap(objectFor).map((object) => ({
      ...object,
      type: decodeDatObject(encodeDatObject(object.type)),
    })),
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
    .map(decodedTerrainFor);
  if (special.length === 1) {
    return taggedTerrain(special[0]);
  }
  if (special.length > 1) {
    throw new Error(`Patch map ${x},${y} 包含多个可编码的覆盖地形 Entity`);
  }
  const candidates = entities.map(decodedTerrainFor).filter(Boolean);
  if (candidates.length !== 1)
    throw new Error(
      `Patch map ${x},${y} 必须恰好包含一个可编码的地形 Entity，实际为 ${candidates.length}`,
    );
  return taggedTerrain(candidates[0]);
}

function decodedTerrainFor(entity) {
  const { type } = entity;
  if (type === EntityTypeId.SNOW) return DecodedTerrain.SNOW;
  if (type === EntityTypeId.HIGH_GRASS) return DecodedTerrain.HIGH_GRASS;
  if (type === EntityTypeId.HIGH_GRASS_OBJECTIVE) {
    return DecodedTerrain.HIGH_GRASS_OBJECTIVE;
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
    const channel = correspondenceByField(
      "windSwitch",
      "direction",
      entity.direction,
    )?.channel;
    if (channel === undefined)
      throw new Error("wind-switch 的 direction 必须是 up/down/left/right");
    return `wind-switch-${channel}-${entity.active === true ? "on" : "off"}`;
  }
  if (type === EntityTypeId.TRAP)
    return `trap-${entity.active === false ? "inactive" : "active"}`;
  if (type === EntityTypeId.MIRROR)
    return variantTerrain("mirror", entity.variant, [1, 2, 3, 4]);
  if (type === EntityTypeId.CAROUSEL) {
    const decoded = correspondenceByField(
      "carousel",
      "variant",
      entity.variant,
    )?.decoded;
    if (!decoded) throw new Error("carousel 的 variant 无法编码为原版 DAT");
    return decoded;
  }
  if (type === EntityTypeId.COLOR_YELLOW_BLOCK)
    return `color-yellow-block-${entity.state?.raised ? "raised" : "lowered"}`;
  if (type === EntityTypeId.COLOR_PINK_BLOCK)
    return `color-pink-block-${entity.state?.raised ? "raised" : "lowered"}`;
  if (type === MapEntityTypeId.COLOR_BLOCK) {
    if (entity.color !== "yellow" && entity.color !== "pink")
      throw new Error("color-block 的 color 必须是 yellow/pink");
    return `color-${entity.color}-block-${entity.raised === false ? "lowered" : "raised"}`;
  }
  if (directTerrainTypes.has(type))
    return type;
  return decodedSurfaceTerrain(entity);
}

function decodedSurfaceTerrain(entity) {
  // atlas 分类只负责选图；这些实体在原版 DAT 中占 object byte，保留同格 terrain。
  if (
    entity.type === MapEntityTypeId.FENCE ||
    entity.type === MapEntityTypeId.CLOUD_PARKING
  ) return null;
  const mapping = surfaceMappingForEntity(entity.type, entity);
  if (!mapping) return null;
  const source = mapping.source;
  return `ts-${source.row}-${source.column}`;
}

function objectFor(entity) {
  const { type, x, y } = entity;
  if (type === EntityTypeId.BOBBY || decodedTerrainFor(entity)) return [];
  if (type === EntityTypeId.DRAGON) {
    if (entity.direction !== "left")
      throw new Error("原版 DAT Dragon 只支持 left direction");
    return [{ type: DecodedObject.DRAGON_HEAD_BASE, x: x - 1, y }];
  }
  if (type === EntityTypeId.BEAVER)
    return [{ type: DecodedObject.BEAVER_BASE, x, y }];
  if (type === MapEntityTypeId.EGG_NEST)
    return [{ type: DecodedObject.EGG_NEST_EMPTY, x, y }];
  if (type === MapEntityTypeId.BEANSTALK)
    return [{ type: DecodedObject.BEANSTALK_TIP, x, y }];
  if (type === MapEntityTypeId.WINDMILL) {
    const decodedType = {
      up: DecodedObject.WINDMILL_UP,
      down: DecodedObject.WINDMILL_DOWN,
      left: DecodedObject.WINDMILL_LEFT,
      right: DecodedObject.WINDMILL_RIGHT,
    }[entity.direction];
    if (!decodedType)
      throw new Error("windmill 的 direction 必须是 up/down/left/right");
    return [{ type: decodedType, x, y }];
  }
  if (type === MapEntityTypeId.CLOUD) {
    const decodedType = {
      red: DecodedObject.CLOUD_RED,
      purple: DecodedObject.CLOUD_PURPLE,
      green: DecodedObject.CLOUD_GREEN,
    }[entity.color];
    if (!decodedType) throw new Error("cloud 的 color 必须是 red/purple/green");
    return [{ type: decodedType, x, y }];
  }
  if (type === MapEntityTypeId.CLOUD_PARKING) {
    const decodedType = {
      red: DecodedObject.CLOUD_GRID_RED,
      purple: DecodedObject.CLOUD_GRID_PURPLE,
      green: DecodedObject.CLOUD_GRID_GREEN,
    }[entity.color];
    if (!decodedType)
      throw new Error("cloud-parking 的 color 必须是 red/purple/green");
    return [{ type: decodedType, x, y }];
  }
  if (type === MapEntityTypeId.FENCE) {
    const decodedType = correspondenceByField(
      "fence",
      "variant",
      entity.variant,
    )?.decoded;
    if (!decodedType)
      throw new Error("fence 的 variant 必须是 ts-16-10 到 ts-16-15");
    return [{ type: decodedType, x, y }];
  }
  if (type === EntityTypeId.ICE_BLOCK) {
    const stage = entity.state?.meltStage;
    const decodedType =
      stage === undefined || stage === 0
        ? DecodedObject.ICE_BLOCK
        : {
            1: DecodedObject.ICE_MELT_1,
            2: DecodedObject.ICE_MELT_2,
            3: DecodedObject.ICE_MELT_3,
          }[stage];
    if (!decodedType)
      throw new Error("ice-block 的 state.meltStage 必须是 1 到 3 的整数");
    return [{ type: decodedType, x, y }];
  }
  if (directObjectTypes.has(type))
    return [{ type, x, y }];
  throw new Error(`Entity type 无法编码为原版 DAT：${type}`);
}

function taggedTerrain(type) {
  return decodeDatTerrain(encodeDatTerrain(type));
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
