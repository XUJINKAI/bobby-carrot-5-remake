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
 * Start 数量与隐藏目标类型依赖整张记录，不能在单格转换函数中可靠判断；因此这里先
 * 收集全图事实，再把 object 插入同格 cover 之前，生成可直接审阅的 Entity 堆叠。
 */
export function adaptDecodedMap(map) {
  const entities = [];
  const starts = [];
  const sourceObjects = map.objects ?? [];

  // 空 object 只是原版占位；其它 object 即使是内部部件，也会占用该格的 object 记录。
  const explicitObjectCells = new Set(
    sourceObjects
      .filter((object) => !isEmptyObject(object.type))
      .map((object) => `${object.x},${object.y}`),
  );

  // 原版地图以显式 Carrot 判断目标模式；其余地图的隐藏目标按 Egg 解释。
  const objectiveType = sourceObjects.some((object) => {
    const visual = decodedTileVisual(object.type);
    return visual?.type === MapEntityTypeId.CARROT && visual.phase === undefined;
  })
    ? MapEntityTypeId.CARROT
    : MapEntityTypeId.EGG;

  for (let y = 0; y < map.height; y += 1) {
    const row = map.terrain[y];
    if (!row || row.length !== map.width) {
      throw new Error(
        `Decoded terrain row ${y} does not match width ${map.width}`,
      );
    }
    for (let x = 0; x < map.width; x += 1) {
      const visual = requireDecodedVisual(row[x], "terrain");
      if (visual.type === MapEntityTypeId.START) starts.push({ x, y });
      entities.push(
        ...adaptDecodedTerrain(row[x], x, y, {
          hiddenObjectiveType:
            visual.type === MapEntityTypeId.HIGH_GRASS &&
            visual.phase === "objective" &&
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

  // DAT 只用 Start terrain 保存出生位置；LevelMap 显式保存同格 Bobby。
  entities.push(entity(MapEntityTypeId.BOBBY, starts[0].x, starts[0].y));

  // 原版 objects 表与 terrain 分开保存；语义地图按 ground/content/cover 排列同格 Entity。
  for (const object of sourceObjects) {
    for (const adapted of adaptDecodedObject(object)) {
      insertBelowCover(entities, adapted);
    }
  }

  return {
    width: map.width,
    height: map.height,
    entities,
  };
}

/**
 * 把一个 DAT terrain 单元展开为一个或多个 LevelEntity。
 * 普通单元直接使用目录语义；原版把 cover 与底层地面压进同一 byte 的情况在此展开。
 */
export function adaptDecodedTerrain(type, x, y, options = {}) {
  const visual = requireDecodedVisual(type, "terrain");

  // object 区中的 TS 单元若出现在 terrain，按原坐标保真，避免把层语义混入面板分类。
  if (isDatObjectTile(type)) {
    return [
      entity(MapEntityTypeId.ORIGINAL_TILE, x, y, {
        variant: decodedAtlasCoordinate(type),
      }),
    ];
  }

  if (visual.type === MapEntityTypeId.SNOW) {
    // Snow byte 同时压缩了地面和积雪；语义地图展开为 ts-8-13 Surface + Snow。
    return [
      canonicalTerrainEntity("ts-8-13", x, y),
      entity(MapEntityTypeId.SNOW, x, y),
    ];
  }
  if (visual.type === MapEntityTypeId.HIGH_GRASS) {
    // High Grass 被割除后必须留下地面；objective phase 还可能隐含一个主目标。
    return [
      canonicalTerrainEntity(mowedGroundAt(x, y), x, y),
      ...(options.hiddenObjectiveType
        ? [entity(options.hiddenObjectiveType, x, y)]
        : []),
      entity(MapEntityTypeId.HIGH_GRASS, x, y),
    ];
  }

  const surface = surfaceMappingForTs(visual.row, visual.column);
  if (surface) {
    // Surface variant 保留具体 TS 坐标，避免相同 type 的不同地形语义被合并。
    return [entity(surface.type, x, y, surface.fields ?? {})];
  }

  // Start、机关等 terrain 直接沿用目录声明的稳定 type 与初始字段。
  return [canonicalVisualEntity(visual, x, y)];
}

/**
 * 把一项 DAT object 记录转换为 canonical LevelEntity。
 * 内部部件与动画阶段不会成为独立 Entity；只有记录 anchor 的图块生成持久化对象。
 */
export function adaptDecodedObject(object) {
  const { x, y } = object;
  const visual = requireDecodedVisual(object.type, "object");
  if (!isDatObjectTile(object.type)) {
    throw new Error(`Unsupported decoded object tile: ${object.type}`);
  }

  // ts-16-16 是 objects 表的空值，不生成语义实体。
  if (isEmptyVisual(visual)) return [];

  if (visual.type === MapEntityTypeId.DRAGON) {
    if (visual.role !== "head") return [];

    // 原版保存左侧 head；canonical Dragon 保存中间 body anchor，所以向右移动一格。
    return [
      entity(MapEntityTypeId.DRAGON, x + 1, y, { direction: "left" }),
    ];
  }

  if (visual.role) {
    // body/tail/middle 等单元由 Engine footprint 展开，不在 LevelMap 重复持久化。
    if (!OBJECT_ANCHOR_ROLES.has(visual.role)) return [];
    return [canonicalVisualEntity(visual, x, y)];
  }
  if (visual.phase && !PHASE_COLLAPSED_OBJECT_TYPES.has(visual.type)) {
    // 没有稳定地图身份的瞬时 phase 只属于原版画面，不生成开局 Entity。
    return [];
  }

  // Carrot/Egg/Plank/Ice Block 的 phase 共用同一地图身份与开局规则。
  return [canonicalVisualEntity(visual, x, y)];
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

/**
 * Entity 数组按同格视觉堆叠保持可读：Surface 在前，content 居中，Snow/High Grass
 * cover 在后。Engine 最终仍按 Definition stackOrder 建立权威 Cell Stack。
 */
function insertBelowCover(entities, inserted) {
  const coverIndex = entities.findIndex(
    (candidate) =>
      candidate.x === inserted.x &&
      candidate.y === inserted.y &&
      (candidate.type === MapEntityTypeId.SNOW ||
        candidate.type === MapEntityTypeId.HIGH_GRASS),
  );
  if (coverIndex === -1) {
    entities.push(inserted);
    return;
  }
  entities.splice(coverIndex, 0, inserted);
}

function isEmptyObject(type) {
  const visual = decodedTileVisual(type);
  return visual ? isEmptyVisual(visual) : false;
}

function isEmptyVisual(visual) {
  return visual.type === MapEntityTypeId.TRANSPARENT && visual.cell === "16-16";
}

function requireDecodedVisual(type, layer) {
  const visual = decodedTileVisual(type);
  if (!visual) throw new Error(`Unsupported decoded ${layer} tile: ${type}`);
  return visual;
}

function entity(type, x, y, extra = {}) {
  return { type, x, y, ...extra };
}
