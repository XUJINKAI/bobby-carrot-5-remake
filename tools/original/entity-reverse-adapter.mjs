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
 * 这里先按坐标收集完整的 canonical Cell Stack，再逐格同时生成一个 terrain 和
 * 零到多个 objects，最终字节序列由 `dat/record.mjs` 编码。
 */
export function reverseEntityMap(map) {
  validateMapShape(map);
  const cells = buildCanonicalStackCells(map);
  analyzeCanonicalMap(cells);
  const adaptedCells = cells.map(reverseStackCell);

  return {
    width: map.width,
    height: map.height,
    terrain: Array.from({ length: map.height }, (_, y) =>
      adaptedCells
        .slice(y * map.width, (y + 1) * map.width)
        .map((cell) => cell.terrain),
    ),
    objects: adaptedCells.flatMap((cell) => cell.objects),
  };
}

/** 将 LevelMap 的扁平 Entity 数组归并为按行排列的 canonical Cell Stack。 */
function buildCanonicalStackCells(map) {
  const rows = Array.from({ length: map.height }, (_, y) =>
    Array.from({ length: map.width }, (_, x) => ({ x, y, entities: [] })),
  );
  for (const entity of map.entities) {
    rows[entity.y][entity.x].entities.push(entity);
  }
  return rows.flat();
}

/** DAT 只保存 Start，因此 Bobby 与 Start 的配对必须在逐格转换前确认。 */
function analyzeCanonicalMap(cells) {
  const bobbyCells = [];
  const startCells = [];
  for (const cell of cells) {
    for (const entity of cell.entities) {
      if (entity.type === MapEntityTypeId.BOBBY) bobbyCells.push(cell);
      if (entity.type === MapEntityTypeId.START) startCells.push(cell);
    }
  }
  if (bobbyCells.length !== 1) {
    throw new Error("Patch map 必须恰好包含一个 Bobby Entity");
  }
  if (startCells.length !== 1) {
    throw new Error("Patch map 必须恰好包含一个 Start Entity");
  }
  if (bobbyCells[0] !== startCells[0]) {
    throw new Error("Bobby 必须与 Start Entity 位于同一格");
  }
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
 * 将一个 canonical Cell Stack 同时压回一个 DAT terrain 和零到多个 objects。
 * switch 只列字段补全、层转换和 anchor 移动；普通类型继续由集合和 Surface 映射处理。
 */
function reverseStackCell(cell) {
  const terrainCandidates = [];
  const coverTerrains = [];
  const objects = [];
  const { x, y } = cell;

  for (const entity of cell.entities) {
    const { type } = entity;
    switch (type) {
      case MapEntityTypeId.BOBBY:
        // Bobby 的出生位置由同格 Start terrain 表达。
        continue;

      case MapEntityTypeId.SNOW:
      case MapEntityTypeId.HIGH_GRASS:
        // 原版把 cover 直接保存为 terrain byte，稍后覆盖同格底层 Surface。
        coverTerrains.push(tile({ type }));
        continue;

      case MapEntityTypeId.TIDE:
      case MapEntityTypeId.SPEED:
        terrainCandidates.push(
          tile({ type, fields: { direction: entity.direction } }),
        );
        continue;

      case MapEntityTypeId.SPEED_SWITCH:
      case MapEntityTypeId.TIDE_SWITCH:
      case MapEntityTypeId.CAROUSEL_SWITCH:
        // canonical JSON 可以省略默认 false；selector 必须显式补齐才能唯一匹配。
        terrainCandidates.push(
          tile({ type, fields: { pressed: entity.pressed ?? false } }),
        );
        continue;

      case MapEntityTypeId.WIND_SWITCH:
        terrainCandidates.push(
          tile({
            type,
            fields: {
              direction: entity.direction,
              active: entity.active ?? false,
            },
          }),
        );
        continue;

      case MapEntityTypeId.TRAP:
        // Trap 的 canonical 默认值是 active=true。
        terrainCandidates.push(
          tile({ type, fields: { active: entity.active ?? true } }),
        );
        continue;

      case MapEntityTypeId.MIRROR:
      case MapEntityTypeId.CAROUSEL:
        terrainCandidates.push(
          tile({ type, fields: { variant: entity.variant } }),
        );
        continue;

      case MapEntityTypeId.COLOR_SWITCH:
        terrainCandidates.push(
          tile({
            type,
            fields: {
              color: entity.color,
              state: entity.state ?? "state-1",
            },
          }),
        );
        continue;

      case MapEntityTypeId.COLOR_BLOCK:
        terrainCandidates.push(
          tile({
            type,
            fields: {
              color: entity.color,
              raised: entity.raised ?? true,
            },
          }),
        );
        continue;

      case MapEntityTypeId.ORIGINAL_TILE: {
        const visual = decodedTileVisual(entity.variant);
        if (!visual) {
          throw new Error("original-tile 的 variant 必须是有效 ts.png 坐标");
        }
        terrainCandidates.push(decodedTileLabel(visual));
        continue;
      }

      case MapEntityTypeId.DRAGON:
        if (entity.direction !== "left") {
          throw new Error("原版 DAT Dragon 只支持 left direction");
        }
        // canonical anchor 位于 body；原版 objects 表保存其左侧 head。
        objects.push({ type: tile({ type, role: "head" }), x: x - 1, y });
        continue;

      case MapEntityTypeId.BEAVER:
      case MapEntityTypeId.SANDMAN:
      case MapEntityTypeId.DREAM_MACHINE:
        // canonical anchor 位于 body；原版 objects 表保存其上方 head。
        objects.push({ type: tile({ type, role: "head" }), x, y: y - 1 });
        continue;

      case MapEntityTypeId.BEANSTALK:
        // 稳定 anchor 对应原版 tip；middle/base/sprout 是内部阶段。
        objects.push({ type: tile({ type, role: "tip" }), x, y });
        continue;

      case MapEntityTypeId.WINDMILL:
        objects.push({
          type: tile({ type, fields: { direction: entity.direction } }),
          x,
          y,
        });
        continue;

      case MapEntityTypeId.CLOUD:
      case MapEntityTypeId.CLOUD_PARKING:
        objects.push({
          type: tile({ type, fields: { color: entity.color } }),
          x,
          y,
        });
        continue;

      case MapEntityTypeId.FENCE:
        objects.push({
          type: tile({ type, fields: { variant: entity.variant } }),
          x,
          y,
        });
        continue;

      default:
        if (BASE_TERRAIN_TYPES.has(type)) {
          terrainCandidates.push(tile({ type }));
          continue;
        }
        if (BASE_OBJECT_TYPES.has(type)) {
          // 运行时 phase 不属于 LevelMap，Patch 从目录声明的 base Visual 开始。
          objects.push({ type: tile({ type }), x, y });
          continue;
        }

        // 普通 Surface 用稳定 variant 找回具体 TS 单元。
        const mapping = surfaceMappingForEntity(type, entity);
        if (mapping) {
          const visual = originalTileAtlasCell(
            "ts",
            mapping.source.row,
            mapping.source.column,
          );
          if (!visual) {
            throw new Error(`Surface 缺少原版 Tile Visual：${type}`);
          }
          terrainCandidates.push(decodedTileLabel(visual));
          continue;
        }
        throw new Error(`Entity type 无法编码为原版 DAT：${type}`);
    }
  }

  if (coverTerrains.length > 1) {
    throw new Error(`Patch map ${x},${y} 包含多个可编码的覆盖地形 Entity`);
  }
  if (coverTerrains.length === 1) {
    return { terrain: coverTerrains[0], objects };
  }
  if (terrainCandidates.length !== 1) {
    throw new Error(
      `Patch map ${x},${y} 必须恰好包含一个可编码的地形 Entity，实际为 ${terrainCandidates.length}`,
    );
  }
  return { terrain: terrainCandidates[0], objects };
}

/** selector 必须唯一匹配目录条目；返回带可读名称的 decoded 坐标标签。 */
function tile(selector) {
  return decodedTileLabel(originalTileVisual(selector));
}
