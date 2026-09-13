import {
  MapEntityTypeId,
  originalTileAtlasCell,
  originalTileVisualGroups,
  parseOriginalTileCoordinateLabel,
  surfaceMappingForTs,
} from "@bobby/model";
import {
  PUSHBOX_TERRAIN_SEED,
  PUSHBOX_TERRAIN_TABLE,
} from "./pushbox-terrain-table.mjs";

const categories = ["ground", "boundary", "obstacle"];

export function createPushboxTerrainPicker(
  mapKey,
  table = PUSHBOX_TERRAIN_TABLE,
  seed = PUSHBOX_TERRAIN_SEED,
) {
  if (typeof mapKey !== "string" || !mapKey) {
    throw new Error("Pushbox 地形选取需要 collection/map ID");
  }
  if (typeof seed !== "string" || !seed) {
    throw new Error("Pushbox 地形选取需要非空 seed");
  }
  if (!table || typeof table !== "object" || Array.isArray(table)) {
    throw new Error("Pushbox 地形表需要主题对象");
  }
  const themes = Object.entries(table).map(([name, theme]) => {
    if (!theme || typeof theme !== "object" || Array.isArray(theme)) {
      throw new Error(`Pushbox 地形表 ${name} 需要类别对象`);
    }
    const groups = Object.fromEntries(categories.map((category) => {
      const choices = theme[category];
      if (!Array.isArray(choices) || choices.length === 0) {
        throw new Error(`Pushbox 地形表 ${name}.${category} 至少需要一个素材`);
      }
      return [
        category,
        choices.map((label) => resolveTile(label, `${name}.${category}`, category)),
      ];
    }));
    return groups;
  });
  if (themes.length === 0) throw new Error("Pushbox 地形表至少需要一个主题");
  const selected = themes[stableIndex(`${seed}|${mapKey}|theme`, themes.length)];

  return (category, x, y) => {
    const group = selected[category];
    if (!group) throw new Error(`未知 Pushbox 地形类别：${category}`);
    const index = stableIndex(
      `${seed}|${mapKey}|${category}|${x},${y}`,
      group.length,
    );
    return { ...group[index], x, y };
  };
}

function resolveTile(label, location, category) {
  if (label === MapEntityTypeId.SNOW && category !== "ground") {
    return { type: MapEntityTypeId.SNOW };
  }
  let coordinate = typeof label === "string"
    ? parseOriginalTileCoordinateLabel(label)
    : undefined;
  if (!coordinate && typeof label === "string") {
    const group = originalTileVisualGroups("surface").find((entry) =>
      entry.type === label
    );
    if (group) {
      const baseVisuals = group.visuals.filter((visual) =>
        Object.keys(visual.fields).length === 0 &&
        visual.role === undefined &&
        visual.phase === undefined
      );
      if (baseVisuals.length !== 1) {
        throw new Error(
          `Pushbox 地形表 ${location} 的 ${label} 有多个形态，请填写具体 ts-行-列`,
        );
      }
      coordinate = baseVisuals[0];
    }
  }
  const mapping = coordinate
    ? surfaceMappingForTs(coordinate.row, coordinate.column)
    : undefined;
  if (!mapping && coordinate && category !== "ground") {
    const visual = originalTileAtlasCell("ts", coordinate.row, coordinate.column);
    if (visual?.type === MapEntityTypeId.SNOW) {
      return { type: MapEntityTypeId.SNOW };
    }
  }
  if (!mapping) {
    throw new Error(`Pushbox 地形表 ${location} 包含未知地形素材：${String(label)}`);
  }
  return { type: mapping.type, ...(mapping.fields ?? {}) };
}

function stableIndex(key, length) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}
