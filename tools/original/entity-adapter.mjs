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

const OBJECT_ANCHOR_ROLES = new Set(["head", "tip"]);
const PHASE_COLLAPSED_OBJECT_TYPES = new Set([
  MapEntityTypeId.CARROT,
  MapEntityTypeId.EGG,
  MapEntityTypeId.PLANK,
  MapEntityTypeId.ICE_BLOCK,
]);

export function adaptDecodedMap(map) {
  const entities = [];
  const starts = [];
  const sourceObjects = map.objects ?? [];
  const explicitObjectCells = new Set(
    sourceObjects
      .filter((object) => !isEmptyObject(object.type))
      .map((object) => `${object.x},${object.y}`),
  );
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
  entities.push(entity(MapEntityTypeId.BOBBY, starts[0].x, starts[0].y));

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
    return [
      canonicalTerrainEntity("ts-10-2", x, y),
      entity(MapEntityTypeId.SNOW, x, y),
    ];
  }
  if (visual.type === MapEntityTypeId.HIGH_GRASS) {
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
    return [entity(surface.type, x, y, surface.fields ?? {})];
  }
  return [canonicalVisualEntity(visual, x, y)];
}

export function adaptDecodedObject(object) {
  const { x, y } = object;
  const visual = requireDecodedVisual(object.type, "object");
  if (!isDatObjectTile(object.type)) {
    throw new Error(`Unsupported decoded object tile: ${object.type}`);
  }
  if (isEmptyVisual(visual)) return [];

  if (visual.type === MapEntityTypeId.DRAGON) {
    if (visual.role !== "head") return [];
    return [
      entity(MapEntityTypeId.DRAGON, x + 1, y, { direction: "left" }),
    ];
  }

  if (visual.role) {
    if (!OBJECT_ANCHOR_ROLES.has(visual.role)) return [];
    return [canonicalVisualEntity(visual, x, y)];
  }
  if (visual.phase && !PHASE_COLLAPSED_OBJECT_TYPES.has(visual.type)) {
    return [];
  }
  return [canonicalVisualEntity(visual, x, y)];
}

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
