import { MapEntityTypeId } from "@bobby/model";

/**
 * Original Explore filter 的人工审阅入口。
 *
 * 每个 option 在同一行声明 UI 信息与 canonical Entity 匹配依据。生成 collection
 * index 时只发布 id/name/icons；生成 map 标签时使用 match。表外 Entity 不参与推断。
 * `snow-cloud` 是雪地与星空共用的底板，因此场景分别由 `snow` 和 `starfield`
 * 确认，不能从共用底板猜测。
 */
export const ORIGINAL_EXPLORE_FILTER_DEFINITIONS = [
  {
    id: "targets",
    name: "目标",
    selection: "single",
    options: [
      goalOption("carrot", "萝卜", MapEntityTypeId.CARROT),
      goalOption("egg", "彩蛋", MapEntityTypeId.EGG),
    ],
  },
  {
    id: "target-count",
    name: "目标数",
    selection: "single",
    options: [
      countOption("0-10", 0, 10),
      countOption("11-20", 11, 20),
      countOption("21-40", 21, 40),
      countOption("41-60", 41, 60),
      countOption("61+", 61),
    ],
  },
  {
    id: "scenes",
    name: "场景",
    selection: "multiple",
    options: [
      entityOption("grassland", "草地", [MapEntityTypeId.GRASS], [
        entityIcon(MapEntityTypeId.GRASS, { variant: "ts-10-1" }),
      ]),
      entityOption(
        "water",
        "水域",
        [
          MapEntityTypeId.WATER,
          MapEntityTypeId.WATERFALL,
          MapEntityTypeId.TIDE,
        ],
        [entityIcon(MapEntityTypeId.WATER, { variant: "ripple" })],
      ),
      entityOption("snow", "雪地", [MapEntityTypeId.SNOW], [
        entityIcon(MapEntityTypeId.SNOW),
      ]),
      entityOption(
        "starfield",
        "星空",
        [MapEntityTypeId.STARFIELD],
        [
          entityIcon(MapEntityTypeId.STARFIELD, {
            variant: "large-star",
          }),
        ],
      ),
      entityOption("desert", "沙漠", [MapEntityTypeId.SAND], [
        entityIcon(MapEntityTypeId.SAND),
      ]),
    ],
  },
  {
    id: "mechanics",
    name: "道具与机关",
    selection: "multiple",
    options: [
      entityOption(
        "speed",
        "加速带",
        [MapEntityTypeId.SPEED, MapEntityTypeId.SPEED_SWITCH],
        [
          entityIcon(MapEntityTypeId.SPEED, { direction: "right" }),
          entityIcon(MapEntityTypeId.SPEED_SWITCH, { pressed: false }),
        ],
      ),
      entityOption(
        "mower",
        "割草机/高草",
        [
          MapEntityTypeId.MOWER,
          MapEntityTypeId.GAS,
        ],
        [
          entityIcon(MapEntityTypeId.GAS),
          entityIcon(MapEntityTypeId.MOWER),
        ],
      ),
      entityOption(
        "highgrass",
        "高草",
        [
          MapEntityTypeId.HIGH_GRASS,
        ],
        [
          entityIcon(MapEntityTypeId.HIGH_GRASS),
        ],
      ),
      entityOption(
        "crumblyrock",
        "易碎岩石",
        [
          MapEntityTypeId.CRUMBLY_ROCK,
        ],
        [
          entityIcon(MapEntityTypeId.CRUMBLY_ROCK),
        ],
      ),
      entityOption(
        "bean",
        "魔豆",
        [MapEntityTypeId.BEAN, MapEntityTypeId.BEAN_FIELD],
        [
          entityIcon(MapEntityTypeId.BEAN),
          entityIcon(MapEntityTypeId.BEAN_FIELD),
        ],
      ),
      entityOption(
        "shovel",
        "雪铲/积雪",
        [MapEntityTypeId.SHOVEL_PICKUP, MapEntityTypeId.SNOW],
        [
          entityIcon(MapEntityTypeId.SHOVEL_PICKUP),
          entityIcon(MapEntityTypeId.SNOW),
        ],
      ),
      entityOption(
        "kite",
        "风筝/龙卷风",
        [
          MapEntityTypeId.KITE,
          MapEntityTypeId.WHIRLWIND,
          MapEntityTypeId.LANDING,
        ],
        [
          entityIcon(MapEntityTypeId.KITE),
          entityIcon(MapEntityTypeId.WHIRLWIND),
          entityIcon(MapEntityTypeId.LANDING),
        ],
      ),
      entityOption(
        "tide",
        "潮汐",
        [
          MapEntityTypeId.TIDE,
          MapEntityTypeId.TIDE_SWITCH,
        ],
        [
          entityIcon(MapEntityTypeId.TIDE, { direction: "right" }),
          entityIcon(MapEntityTypeId.TIDE_SWITCH, { pressed: false }),
        ],
      ),
      entityOption(
        "leaf",
        "叶子",
        [
          MapEntityTypeId.LEAF,
        ],
        [
          entityIcon(MapEntityTypeId.LEAF),
        ],
      ),
      entityOption(
        "color",
        "彩色方块",
        [MapEntityTypeId.COLOR_BLOCK, MapEntityTypeId.COLOR_SWITCH],
        [
          entityIcon(MapEntityTypeId.COLOR_BLOCK, {
            color: "yellow",
            raised: true,
          }),
          entityIcon(MapEntityTypeId.COLOR_SWITCH, {
            color: "yellow",
            state: "state-1",
          }),
        ],
      ),
      entityOption(
        "carousel",
        "旋转通道",
        [MapEntityTypeId.CAROUSEL, MapEntityTypeId.CAROUSEL_SWITCH],
        [
          entityIcon(MapEntityTypeId.CAROUSEL, { variant: "right-top" }),
          entityIcon(MapEntityTypeId.CAROUSEL_SWITCH, { pressed: false }),
        ],
      ),
      entityOption(
        "dragon",
        "龙/镜子/冰块",
        [
          MapEntityTypeId.DRAGON,
          MapEntityTypeId.MIRROR,
          MapEntityTypeId.ICE_BLOCK,
        ],
        [
          entityIcon(MapEntityTypeId.DRAGON, { direction: "left" }),
          entityIcon(MapEntityTypeId.MIRROR, { variant: "right-bottom" }),
          entityIcon(MapEntityTypeId.ICE_BLOCK),
        ],
      ),
      entityOption(
        "wind",
        "风车/云",
        [
          MapEntityTypeId.WINDMILL,
          MapEntityTypeId.WIND_SWITCH,
          MapEntityTypeId.CLOUD,
        ],
        [
          entityIcon(MapEntityTypeId.WINDMILL, { direction: "right" }),
          entityIcon(MapEntityTypeId.WIND_SWITCH, {
            direction: "right",
            active: false,
          }),
          entityIcon(MapEntityTypeId.CLOUD, { color: "red" }),
        ],
      ),
      entityOption("trap", "陷阱", [MapEntityTypeId.TRAP], [
        entityIcon(MapEntityTypeId.TRAP, { active: true }),
      ]),
      entityOption("plank", "木板", [MapEntityTypeId.PLANK], [
        entityIcon(MapEntityTypeId.PLANK),
      ]),
    ],
  },
];

export function originalExploreFilters() {
  return ORIGINAL_EXPLORE_FILTER_DEFINITIONS.map((filter) => ({
    id: filter.id,
    name: filter.name,
    selection: filter.selection,
    options: filter.options.map(({ match: _match, ...option }) => option),
  }));
}

export function originalExploreMapFilters(level) {
  const entityTypes = level.entities.map((entity) => entity.type);
  const entitySet = new Set(entityTypes);
  const counts = new Map();

  return Object.fromEntries(
    ORIGINAL_EXPLORE_FILTER_DEFINITIONS.map((filter) => [
      filter.id,
      filter.options
        .filter((option) =>
          matches(option.match, entityTypes, entitySet, counts, level),
        )
        .map((option) => option.id),
    ]),
  );
}

function countOption(id, min, max) {
  return {
    id,
    name: id,
    icons: [
      entityIcon(MapEntityTypeId.EGG),
    ],
    match: {
      type: "entity-count",
      entityTypes: [MapEntityTypeId.EGG],
      min,
      ...(max === undefined ? {} : { max }),
    },
  };
}

function goalOption(id, name, goalType) {
  return {
    id,
    name,
    icons: [entityIcon(goalType)],
    match: { type: "win-goal", goalType },
  };
}

function entityOption(id, name, entityTypes, icons) {
  return {
    id,
    name,
    icons,
    match: { type: "entity-any", entityTypes },
  };
}

function entityIcon(type, fields = {}) {
  return { type: "entity", entity: { type, ...fields } };
}

function matches(match, entityTypes, entitySet, counts, level) {
  if (match.type === "entity-any") {
    return match.entityTypes.some((type) => entitySet.has(type));
  }
  if (match.type === "win-goal") {
    return winConditionHasGoal(level.rules?.win, match.goalType);
  }
  const countKey = match.entityTypes.join("\u0000");
  let count = counts.get(countKey);
  if (count === undefined) {
    const countedTypes = new Set(match.entityTypes);
    count = entityTypes.filter((type) => countedTypes.has(type)).length;
    counts.set(countKey, count);
  }
  return count >= match.min && (match.max === undefined || count <= match.max);
}

function winConditionHasGoal(condition, goalType) {
  if (!condition) return false;
  if (condition.type === "all" || condition.type === "any") {
    return condition.conditions.some((child) =>
      winConditionHasGoal(child, goalType),
    );
  }
  return condition.type === goalType;
}
