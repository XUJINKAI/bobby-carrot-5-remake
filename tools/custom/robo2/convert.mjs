import { ROBO2_TILE_CODE } from "./format.mjs";

const SNOW_THEME = Object.freeze({
  floor: Object.freeze([
    surface({ type: "snow-cloud", variant: "ts-8-16" }),
  ]),
  wall: Object.freeze([surface({ type: "snowy-rock" })]),
});

const THEME_SURFACES = Object.freeze([
  SNOW_THEME,
  SNOW_THEME,
  Object.freeze({
    floor: Object.freeze([surface({ type: "sand" })]),
    wall: Object.freeze([
      surface({ type: "cactus", variant: "small" }),
      surface({ type: "cactus", variant: "round" }),
    ]),
  }),
  Object.freeze({
    floor: Object.freeze([
      surface({ type: "grass", variant: "ts-10-1" }),
    ]),
    wall: Object.freeze([surface({ type: "stump" })]),
  }),
]);
const ROBO2_TERRAIN_SEED = "robo2-terrain-v1";

const LASER_DIRECTIONS = new Map([
  [ROBO2_TILE_CODE.LASER_DOWN, "down"],
  [ROBO2_TILE_CODE.LASER_RIGHT, "right"],
  [ROBO2_TILE_CODE.LASER_UP, "up"],
  [ROBO2_TILE_CODE.LASER_LEFT, "left"],
]);

/**
 * 将一条已解码的 Robo 2 记录转换为纯语义 MapDocument。
 * 来源 theme 只在这里选择现有 Surface，不进入 Engine runtime 字段。
 */
export function convertRobo2Level(level, metadata) {
  validateLevel(level);
  const id = requireText(metadata?.id, "Robo 2 地图 id");
  const title = requireText(metadata?.title, "Robo 2 地图 title");
  const entities = [];

  for (let index = 0; index < level.tiles.length; index += 1) {
    const x = index % level.width;
    const y = Math.floor(index / level.width);
    const code = level.tiles[index];
    entities.push(surfaceEntity(level.theme, code, x, y, id));
    const object = objectEntity(code, x, y);
    if (object) entities.push(object);
  }

  assertSingleton(entities, "bobby", id);
  assertSingleton(entities, "exit", id);
  return {
    schemaVersion: 1,
    meta: {
      name: `${id} · ${title}`,
      author: "HeroCraft",
      note: "Robo 2: Saving Eny（2004）内置关卡；第三方内容。",
    },
    rules: {
      win: {
        type: "all",
        conditions: [{ type: "exit" }],
      },
    },
    width: level.width,
    height: level.height,
    entities,
  };
}

function validateLevel(level) {
  if (!level || typeof level !== "object") {
    throw new TypeError("Robo 2 level 必须是对象");
  }
  if (!Number.isInteger(level.width) || level.width < 1) {
    throw new Error("Robo 2 level width 必须是正整数");
  }
  if (!Number.isInteger(level.height) || level.height < 1) {
    throw new Error("Robo 2 level height 必须是正整数");
  }
  if (!THEME_SURFACES[level.theme]) {
    throw new Error(`Robo 2 level theme 无效：${String(level.theme)}`);
  }
  if (
    !Array.isArray(level.tiles) ||
    level.tiles.length !== level.width * level.height
  ) {
    throw new Error("Robo 2 level tiles 数量与尺寸不一致");
  }
}

function surfaceEntity(theme, code, x, y, mapKey) {
  const surfaces = THEME_SURFACES[theme];
  const category = code === ROBO2_TILE_CODE.WALL ? "wall" : "floor";
  const choices = surfaces[category];
  const selected = weightedSurface(
    choices,
    `${ROBO2_TERRAIN_SEED}|${mapKey}|${category}|${x},${y}`,
  );
  return { ...selected.entity, x, y };
}

function surface(entity, weight = 1) {
  return Object.freeze({ entity: Object.freeze(entity), weight });
}

function weightedSurface(choices, key) {
  const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0);
  let target = stableHash(key) % totalWeight;
  for (const choice of choices) {
    target -= choice.weight;
    if (target < 0) return choice;
  }
  return choices[0];
}

function stableHash(key) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function objectEntity(code, x, y) {
  const base = { x, y, stackOrder: 1 };
  if (code === ROBO2_TILE_CODE.FLOOR || code === ROBO2_TILE_CODE.WALL) {
    return null;
  }
  if (code === ROBO2_TILE_CODE.EXIT) return { type: "exit", ...base };
  if (code === ROBO2_TILE_CODE.STONE) {
    return { type: "laser-stone", ...base };
  }
  if (code === ROBO2_TILE_CODE.BOMB) {
    return { type: "laser-bomb", ...base };
  }
  if (code === ROBO2_TILE_CODE.MIRROR_LEFT) {
    return { type: "laser-mirror", variant: "backslash", ...base };
  }
  if (code === ROBO2_TILE_CODE.MIRROR_RIGHT) {
    return { type: "laser-mirror", variant: "slash", ...base };
  }
  if (LASER_DIRECTIONS.has(code)) {
    return {
      type: "laser-emitter",
      direction: LASER_DIRECTIONS.get(code),
      ...base,
    };
  }
  if (code === ROBO2_TILE_CODE.PLAYER) return { type: "bobby", ...base };
  throw new Error(`Robo 2 tile code 无法转换：${String(code)}`);
}

function assertSingleton(entities, type, id) {
  const count = entities.filter((entity) => entity.type === type).length;
  if (count !== 1) {
    throw new Error(`${id}: ${type} 应恰好出现一次，实际 ${count} 次`);
  }
}

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} 必须是非空字符串`);
  }
  return value.trim();
}
