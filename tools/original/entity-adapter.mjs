import {
  MapEntityTypeId,
  entityMapDefinition,
  surfaceMappingForTs,
} from "@bobby/model";
import {
  decodedAtlasCoordinate,
  decodedTileVisual,
  isDatObjectTile,
} from "./dat/mapping.mjs";

/**
 * 原版 DAT → canonical LevelMap 的人工审阅入口。
 *
 * `dat/mapping.mjs` 只把 byte 还原为 TS 坐标；坐标对应的 `type / fields /
 * role / phase` 来自 Original Tile Visual 目录。本文件只保留无法由坐标机械完成的
 * 结构转换：terrain 堆叠展开、隐藏目标推断、对象阶段合并和 multi-cell anchor 移动。
 *
 * 修改本文件时应优先检查：转换后的 Entity 是否足以让 Engine 独立运行地图，以及
 * 多个原版表示合并后是否仍保留开局所需的全部语义。
 */

/** 原版多格对象只有 head 或 tip 单元能够生成 canonical anchor。 */
const OBJECT_ANCHOR_ROLES = new Set(["head", "tip"]);

/** 这些图块的 phase 是运行过程中的画面，载入地图时折叠到同一个稳定 Entity。 */
const PHASE_COLLAPSED_OBJECT_TYPES = new Set([
  MapEntityTypeId.CARROT,
  MapEntityTypeId.EGG,
  MapEntityTypeId.PLANK,
  MapEntityTypeId.ICE_BLOCK,
]);

/**
 * 转换整张 decoded 地图。
 *
 * DAT 把 terrain 与 objects 分开保存，规则却总是作用于同一坐标的完整内容。这里先
 * 将两张表归并为原版 Cell Stack，再收集全图事实，最后逐格展开为 canonical Entity。
 */
export function adaptDecodedMap(map) {
  const cells = buildOriginalStackCells(map);
  const context = analyzeOriginalMap(cells);
  if (context.startCount !== 1) {
    throw new Error(
      `Original map must contain exactly one Start terrain, got ${context.startCount}`,
    );
  }

  return {
    width: map.width,
    height: map.height,
    entities: cells.flatMap((cell) => adaptStackCell(cell, context)),
  };
}

/**
 * 将原版的 terrain 矩阵和稀疏 objects 表合并为按行排列的 Cell Stack。
 * objects 使用数组，因为 DAT 格式允许同一坐标出现多项记录，并保留其原始顺序。
 */
function buildOriginalStackCells(map) {
  const rows = [];
  for (let y = 0; y < map.height; y += 1) {
    const terrainRow = map.terrain[y];
    if (!terrainRow || terrainRow.length !== map.width) {
      throw new Error(
        `Decoded terrain row ${y} does not match width ${map.width}`,
      );
    }
    rows.push(
      terrainRow.map((type, x) => ({
        x,
        y,
        terrain: {
          type,
          visual: requireDecodedVisual(type, "terrain"),
        },
        objects: [],
      })),
    );
  }

  for (const object of map.objects ?? []) {
    if (
      !Number.isInteger(object.x) ||
      !Number.isInteger(object.y) ||
      object.x < 0 ||
      object.x >= map.width ||
      object.y < 0 ||
      object.y >= map.height
    ) {
      throw new Error(
        `Decoded object coordinate is outside map: ${object.x},${object.y}`,
      );
    }
    rows[object.y][object.x].objects.push({
      source: object,
      visual: requireDecodedObjectVisual(object.type),
    });
  }

  return rows.flat();
}

/** 单格规则需要的整图事实只在这里推导一次。 */
function analyzeOriginalMap(cells) {
  let startCount = 0;
  let hasExplicitCarrot = false;

  for (const cell of cells) {
    if (cell.terrain.visual.type === MapEntityTypeId.START) startCount += 1;
    if (
      cell.objects.some(
        ({ visual }) =>
          visual.type === MapEntityTypeId.CARROT && visual.phase === undefined,
      )
    ) {
      hasExplicitCarrot = true;
    }
  }

  return {
    startCount,
    objectiveType: hasExplicitCarrot
      ? MapEntityTypeId.CARROT
      : MapEntityTypeId.EGG,
  };
}

/**
 * 将一个原版 Cell Stack 转为按 ground/content/cover 排列的 canonical Entity。
 * switch 只列会改变堆叠结构的原版特例；普通坐标继续由 Visual 目录机械转换。
 */
function adaptStackCell(cell, context) {
  const { x, y, terrain, objects } = cell;
  const adaptedObjects = [];

  for (const { source, visual } of objects) {
    // ts-16-16 是 objects 表的空值，不生成语义实体。
    if (isEmptyVisual(visual)) continue;

    switch (visual.type) {
      case MapEntityTypeId.DRAGON:
        if (visual.role === "head") {
          // 原版保存左侧 head；canonical Dragon 保存中间 body anchor。
          adaptedObjects.push(
            entity(MapEntityTypeId.DRAGON, source.x + 1, source.y, {
              direction: "left",
            }),
          );
        }
        break;

      default:
        // body/tail/middle 由 Engine footprint 展开，LevelMap 只保存 anchor。
        if (visual.role && !OBJECT_ANCHOR_ROLES.has(visual.role)) continue;
        // 没有稳定地图身份的瞬时画面不应成为开局 Entity。
        if (
          visual.phase &&
          !PHASE_COLLAPSED_OBJECT_TYPES.has(visual.type)
        ) {
          continue;
        }
        adaptedObjects.push(
          canonicalVisualEntity(visual, source.x, source.y),
        );
    }
  }

  // object 区中的 TS 单元若出现在 terrain，按原坐标保真，避免猜测层语义。
  if (isDatObjectTile(terrain.type)) {
    return [
      entity(MapEntityTypeId.ORIGINAL_TILE, x, y, {
        variant: decodedAtlasCoordinate(terrain.type),
      }),
      ...adaptedObjects,
    ];
  }

  switch (terrain.visual.type) {
    case MapEntityTypeId.SNOW:
      // Snow byte 压缩了地面与积雪；同格 object 位于二者之间。
      return [
        canonicalTerrainEntity("ts-8-13", x, y),
        ...adaptedObjects,
        entity(MapEntityTypeId.SNOW, x, y),
      ];

    case MapEntityTypeId.HIGH_GRASS: {
      // 内部部件即使不生成 Entity，也算显式 object，不能再合成隐藏目标。
      const hasExplicitObject = objects.some(
        ({ visual }) => !isEmptyVisual(visual),
      );
      const hiddenObjective =
        terrain.visual.phase === "objective" && !hasExplicitObject
          ? [entity(context.objectiveType, x, y)]
          : [];
      return [
        canonicalTerrainEntity(mowedGroundAt(x, y), x, y),
        ...adaptedObjects,
        ...hiddenObjective,
        entity(MapEntityTypeId.HIGH_GRASS, x, y),
      ];
    }

    case MapEntityTypeId.START:
      // DAT 只保存 Start terrain；LevelMap 在相同 Cell 显式保存玩家实体。
      return [
        canonicalVisualEntity(terrain.visual, x, y),
        ...adaptedObjects,
        entity(MapEntityTypeId.BOBBY, x, y),
      ];

    default: {
      const surface = surfaceMappingForTs(
        terrain.visual.row,
        terrain.visual.column,
      );
      if (surface) {
        // variant 保留 TS 坐标，防止相同 type 的不同原版地形被合并。
        return [
          entity(surface.type, x, y, surface.fields ?? {}),
          ...adaptedObjects,
        ];
      }
      return [
        canonicalVisualEntity(terrain.visual, x, y),
        ...adaptedObjects,
      ];
    }
  }
}

/**
 * 原版 High Grass 没有保存割除后的地面。本函数从四个可用 Grass 单元中确定性选择，
 * 既让同一张地图重复构建保持一致，也避免整片高草使用完全相同的底图。
 */
export function mowedGroundAt(x, y) {
  return [
    "ts-6-15",
    "ts-6-16",
    "ts-10-1",
    "ts-10-2",
  ][(x * 17 + y * 31) & 3];
}

function canonicalTerrainEntity(type, x, y) {
  const visual = requireDecodedVisual(type, "terrain");
  const mapping = surfaceMappingForTs(visual.row, visual.column);
  if (!mapping) {
    throw new Error(`Mowed ground 不是 Surface：${type}`);
  }
  return entity(mapping.type, x, y, mapping.fields ?? {});
}

function canonicalVisualEntity(visual, x, y) {
  return entity(visual.type, x, y, canonicalFields(visual.type, visual.fields));
}

/**
 * 目录 selector 必须写全字段才能唯一定位图块；canonical JSON 则省略有默认值的
 * 非必填字段。这里按 Model Definition 完成两种表示之间的收束。
 */
function canonicalFields(type, fields) {
  const definition = entityMapDefinition(type);
  if (!definition) throw new Error(`Unknown map entity type: ${type}`);
  return Object.fromEntries(
    Object.entries(fields).filter(([key, value]) => {
      const field = definition.fields.find((candidate) => candidate.key === key);
      return field?.required || field?.default === undefined || field.default !== value;
    }),
  );
}

function isEmptyVisual(visual) {
  return visual.type === MapEntityTypeId.TRANSPARENT && visual.cell === "16-16";
}

function requireDecodedVisual(type, layer) {
  const visual = decodedTileVisual(type);
  if (!visual) throw new Error(`Unsupported decoded ${layer} tile: ${type}`);
  return visual;
}

function requireDecodedObjectVisual(type) {
  const visual = requireDecodedVisual(type, "object");
  if (!isDatObjectTile(type)) {
    throw new Error(`Unsupported decoded object tile: ${type}`);
  }
  return visual;
}

function entity(type, x, y, extra = {}) {
  return { type, x, y, ...extra };
}
