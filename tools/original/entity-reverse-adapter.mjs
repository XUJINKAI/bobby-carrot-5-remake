import {
  MapEntityTypeId,
  originalTileAtlasCell,
  originalTileVisual,
  surfaceMappingForEntity,
} from "@bobby/model";
import {
  decodedTileLabel,
  decodedTileVisual,
} from "./dat/mapping.mjs";

const BASE_TERRAIN_TYPES = new Set([
  MapEntityTypeId.START,
  MapEntityTypeId.EXIT,
  MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
  MapEntityTypeId.SHOP_CLOUD9_TICKET,
  MapEntityTypeId.SHOP_SUPER_KEY,
  MapEntityTypeId.SHOP_STEREO_SYSTEM,
  MapEntityTypeId.SHOP_EXTRA_MUSIC,
  MapEntityTypeId.SHOP_SPEED_SHOES,
  MapEntityTypeId.SHOP_COIN_RADAR,
  MapEntityTypeId.SHOP_EMPTY,
  MapEntityTypeId.SHOVEL_PICKUP,
  MapEntityTypeId.MOWER_PARKING,
]);

const BASE_OBJECT_TYPES = new Set([
  MapEntityTypeId.CARROT,
  MapEntityTypeId.EGG,
  MapEntityTypeId.LOCK,
  MapEntityTypeId.BEAN,
  MapEntityTypeId.PLANK,
  MapEntityTypeId.MOWER,
  MapEntityTypeId.GAS,
  MapEntityTypeId.BEAN_FIELD,
  MapEntityTypeId.ICE_BLOCK,
  MapEntityTypeId.LEAF,
  MapEntityTypeId.CRUMBLY_ROCK,
  MapEntityTypeId.KITE,
  MapEntityTypeId.WHIRLWIND,
  MapEntityTypeId.LANDING,
  MapEntityTypeId.GOLDEN_CARROT,
  MapEntityTypeId.BONUS_COIN,
]);

/** 将产品 Entity Map 还原为 DAT 编码器专用的 decoded terrain/object 表示。 */
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
    objects: map.entities.flatMap(objectFor),
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
  const covers = entities
    .filter(
      (entity) =>
        entity.type === MapEntityTypeId.SNOW ||
        entity.type === MapEntityTypeId.HIGH_GRASS,
    )
    .map(decodedTerrainFor);
  if (covers.length === 1) return covers[0];
  if (covers.length > 1) {
    throw new Error(`Patch map ${x},${y} 包含多个可编码的覆盖地形 Entity`);
  }
  const candidates = entities.map(decodedTerrainFor).filter(Boolean);
  if (candidates.length !== 1) {
    throw new Error(
      `Patch map ${x},${y} 必须恰好包含一个可编码的地形 Entity，实际为 ${candidates.length}`,
    );
  }
  return candidates[0];
}

function decodedTerrainFor(entity) {
  const { type } = entity;
  if (type === MapEntityTypeId.SNOW) return tile({ type });
  if (type === MapEntityTypeId.HIGH_GRASS) return tile({ type });
  if (type === MapEntityTypeId.TIDE) {
    return tile({ type, fields: { direction: entity.direction } });
  }
  if (
    type === MapEntityTypeId.SPEED_SWITCH ||
    type === MapEntityTypeId.TIDE_SWITCH ||
    type === MapEntityTypeId.CAROUSEL_SWITCH
  ) {
    return tile({ type, fields: { pressed: entity.pressed ?? false } });
  }
  if (type === MapEntityTypeId.WIND_SWITCH) {
    return tile({
      type,
      fields: {
        direction: entity.direction,
        active: entity.active ?? false,
      },
    });
  }
  if (type === MapEntityTypeId.TRAP) {
    return tile({ type, fields: { active: entity.active ?? true } });
  }
  if (type === MapEntityTypeId.MIRROR || type === MapEntityTypeId.CAROUSEL) {
    return tile({ type, fields: { variant: entity.variant } });
  }
  if (type === MapEntityTypeId.SPEED) {
    return tile({ type, fields: { direction: entity.direction } });
  }
  if (type === MapEntityTypeId.COLOR_SWITCH) {
    return tile({
      type,
      fields: {
        color: entity.color,
        state: entity.state ?? "state-1",
      },
    });
  }
  if (type === MapEntityTypeId.COLOR_BLOCK) {
    return tile({
      type,
      fields: {
        color: entity.color,
        raised: entity.raised ?? true,
      },
    });
  }
  if (BASE_TERRAIN_TYPES.has(type)) return tile({ type });
  return decodedSurfaceTerrain(entity);
}

function decodedSurfaceTerrain(entity) {
  // 这两类在 DAT object 层保存，Editor 面板分类不改变其记录层。
  if (
    entity.type === MapEntityTypeId.FENCE ||
    entity.type === MapEntityTypeId.CLOUD_PARKING
  ) {
    return null;
  }
  if (entity.type === MapEntityTypeId.ORIGINAL_TILE) {
    const visual = decodedTileVisual(entity.variant);
    if (!visual) {
      throw new Error("original-tile 的 variant 必须是有效 ts.png 坐标");
    }
    return decodedTileLabel(visual);
  }
  const mapping = surfaceMappingForEntity(entity.type, entity);
  if (!mapping) return null;
  const visual = originalTileAtlasCell(
    "ts",
    mapping.source.row,
    mapping.source.column,
  );
  if (!visual) {
    throw new Error(`Surface 缺少原版 Tile Visual：${entity.type}`);
  }
  return decodedTileLabel(visual);
}

function objectFor(entity) {
  const { type, x, y } = entity;
  if (type === MapEntityTypeId.BOBBY || decodedTerrainFor(entity)) return [];
  if (type === MapEntityTypeId.DRAGON) {
    if (entity.direction !== "left") {
      throw new Error("原版 DAT Dragon 只支持 left direction");
    }
    return [{ type: tile({ type, role: "head" }), x: x - 1, y }];
  }
  if (
    type === MapEntityTypeId.BEAVER ||
    type === MapEntityTypeId.SANDMAN ||
    type === MapEntityTypeId.DREAM_MACHINE
  ) {
    return [{ type: tile({ type, role: "head" }), x, y }];
  }
  if (type === MapEntityTypeId.BEANSTALK) {
    return [{ type: tile({ type, role: "tip" }), x, y }];
  }
  if (type === MapEntityTypeId.WINDMILL) {
    return [{ type: tile({ type, fields: { direction: entity.direction } }), x, y }];
  }
  if (type === MapEntityTypeId.CLOUD || type === MapEntityTypeId.CLOUD_PARKING) {
    return [{ type: tile({ type, fields: { color: entity.color } }), x, y }];
  }
  if (type === MapEntityTypeId.FENCE) {
    return [{ type: tile({ type, fields: { variant: entity.variant } }), x, y }];
  }
  if (BASE_OBJECT_TYPES.has(type)) {
    return [{ type: tile({ type }), x, y }];
  }
  throw new Error(`Entity type 无法编码为原版 DAT：${type}`);
}

function tile(selector) {
  return decodedTileLabel(originalTileVisual(selector));
}

function validateBobbyStartPair(entities) {
  const bobby = entities.filter((entity) => entity.type === MapEntityTypeId.BOBBY);
  const starts = entities.filter((entity) => entity.type === MapEntityTypeId.START);
  if (bobby.length !== 1) {
    throw new Error("Patch map 必须恰好包含一个 Bobby Entity");
  }
  if (starts.length !== 1) {
    throw new Error("Patch map 必须恰好包含一个 Start Entity");
  }
  if (bobby[0].x !== starts[0].x || bobby[0].y !== starts[0].y) {
    throw new Error("Bobby 必须与 Start Entity 位于同一格");
  }
}
