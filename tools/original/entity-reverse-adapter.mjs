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

/**
 * canonical LevelMap → 原版 DAT decoded record 的人工审阅入口。
 *
 * 本文件只服务原版 JAR patch。它用 Original Tile Visual selector 选择 TS 坐标，
 * 并集中声明语义地图如何压回“每格一个 terrain、另有 objects 表”的原版结构。
 *
 * 修改本文件时应优先检查：同格 Entity 是否能无歧义压缩、默认写回哪个静态图块、
 * multi-cell anchor 如何换算，以及不能表达的地图是否会明确报错。
 */

/** 无字段、无特殊展开规则，能够直接选择 base Visual 的 terrain 类型。 */
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

/** 无字段、无 anchor 移动，Patch 时统一写回 base Visual 的 object 类型。 */
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

/**
 * 将产品 Entity Map 还原为 DAT 编码器专用的 decoded terrain/object 表示。
 * 这里先按坐标收集全部 Entity，以便逐格检查 terrain 是否唯一；objects 仍按
 * LevelMap 中的 Entity 顺序生成，最终字节序列由 `dat/record.mjs` 编码。
 */
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

/** Patch 输入必须已经符合当前 schema v1 的基本形状和 DAT 单字节尺寸限制。 */
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

/**
 * 为一格选择唯一 DAT terrain。
 * Snow 与 High Grass 在语义地图里是 cover，但原版把它们直接写进 terrain byte，
 * 因而优先于同格的底层 Surface。其它情况必须恰好找到一个可编码 Surface/terrain。
 */
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

/** 把一个可作为 terrain 的 LevelEntity 转成完整 Visual selector。 */
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
    // canonical JSON 可以省略默认 false；Visual selector 必须显式补齐才能唯一匹配。
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
    // Trap 的 canonical 默认值是 active=true。
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

/**
 * 将语义 Surface 还原为具体 TS 单元。
 * `original-tile` 已经携带坐标；普通 Surface 通过 Model 的稳定 variant 映射定位。
 */
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

/** 把一个非 terrain Entity 写成零项或一项 DAT object。 */
function objectFor(entity) {
  const { type, x, y } = entity;

  // Bobby 的出生位置由 Start terrain 表达；所有 terrain Entity 都不会进入 objects 表。
  if (type === MapEntityTypeId.BOBBY || decodedTerrainFor(entity)) return [];
  if (type === MapEntityTypeId.DRAGON) {
    if (entity.direction !== "left") {
      throw new Error("原版 DAT Dragon 只支持 left direction");
    }

    // canonical anchor 位于 body；原版 objects 表保存其左侧 head。
    return [{ type: tile({ type, role: "head" }), x: x - 1, y }];
  }
  if (
    type === MapEntityTypeId.BEAVER ||
    type === MapEntityTypeId.SANDMAN ||
    type === MapEntityTypeId.DREAM_MACHINE
  ) {
    // 这些 footprint 在原版以 head 定位，body 由原版运行时或相邻记录表现。
    return [{ type: tile({ type, role: "head" }), x, y }];
  }
  if (type === MapEntityTypeId.BEANSTALK) {
    // Beanstalk 的稳定地图 anchor 对应原版 tip；middle/base/sprout 是内部阶段。
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
    // 运行时 phase 不属于 LevelMap，Patch 总是从目录声明的 base Visual 开始。
    return [{ type: tile({ type }), x, y }];
  }
  throw new Error(`Entity type 无法编码为原版 DAT：${type}`);
}

/** selector 必须唯一匹配目录条目；返回带可读名称的 decoded 坐标标签。 */
function tile(selector) {
  return decodedTileLabel(originalTileVisual(selector));
}

/** DAT 只保存 Start，因此 Patch 要求 Bobby 与唯一 Start 位于同一格。 */
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
