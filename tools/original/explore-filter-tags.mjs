import { MapEntityTypeId } from "@bobby/model";

/**
 * Original Explore filter 的人工审阅入口。
 *
 * 每个 option 在同一行声明 UI 信息与 canonical Entity 匹配依据。生成 collection
 * index 时只发布 id/name/icon；生成 map 标签时使用 match。表外 Entity 不参与推断。
 * `snow-cloud` 是雪地与星空共用的底板，因此场景分别由 `snow` 和 `starfield`
 * 确认，不能从共用底板猜测。
 */
export const ORIGINAL_EXPLORE_FILTER_DEFINITIONS = [
  {
    id: "carrots",
    name: "萝卜数",
    selection: "single",
    options: [
      countOption("0-10", 0, 10),
      countOption("11-20", 11, 20),
      countOption("21-40", 21, 40),
      countOption("40-60", 40, 60),
      countOption("61+", 61),
    ],
  },
  {
    id: "scenes",
    name: "场景",
    selection: "multiple",
    options: [
      entityOption("grassland", "草地", "grass", [MapEntityTypeId.GRASS], {
        variant: "ts-10-1",
      }),
      entityOption(
        "water",
        "水域",
        "water",
        [
          MapEntityTypeId.WATER,
          MapEntityTypeId.WATERFALL,
          MapEntityTypeId.TIDE,
        ],
        { variant: "ripple" },
      ),
      entityOption("snow", "雪地", "snow", [MapEntityTypeId.SNOW]),
      entityOption(
        "starfield",
        "星空",
        "starfield",
        [MapEntityTypeId.STARFIELD],
        { variant: "large-star" },
      ),
      entityOption("desert", "沙漠", "sand", [MapEntityTypeId.SAND]),
    ],
  },
  {
    id: "items",
    name: "特殊道具",
    selection: "multiple",
    options: [
      entityOption("shovel", "雪铲", "shovel-pickup", [
        MapEntityTypeId.SHOVEL_PICKUP,
      ]),
      entityOption("gas", "汽油", "gas", [MapEntityTypeId.GAS]),
      entityOption("bean", "魔豆", "bean", [MapEntityTypeId.BEAN]),
      entityOption("kite", "风筝", "kite", [MapEntityTypeId.KITE]),
      entityOption("golden-carrot", "金胡萝卜", "golden-carrot", [
        MapEntityTypeId.GOLDEN_CARROT,
      ]),
      entityOption("bonus-coin", "Bonus Coin", "bonus-coin", [
        MapEntityTypeId.BONUS_COIN,
      ]),
    ],
  },
  {
    id: "mechanics",
    name: "机关",
    selection: "multiple",
    options: [
      entityOption(
        "tide",
        "潮汐",
        "tide",
        [MapEntityTypeId.TIDE, MapEntityTypeId.TIDE_SWITCH],
        { direction: "right" },
      ),
      entityOption(
        "speed",
        "加速带",
        "speed",
        [MapEntityTypeId.SPEED, MapEntityTypeId.SPEED_SWITCH],
        { direction: "right" },
      ),
      entityOption(
        "carousel",
        "旋转通道",
        "carousel",
        [MapEntityTypeId.CAROUSEL, MapEntityTypeId.CAROUSEL_SWITCH],
        { variant: "right-top" },
      ),
      entityOption(
        "wind",
        "风车 / 云",
        "windmill",
        [
          MapEntityTypeId.WIND_SWITCH,
          MapEntityTypeId.WINDMILL,
          MapEntityTypeId.CLOUD,
          MapEntityTypeId.CLOUD_PARKING,
        ],
        { direction: "right" },
      ),
      entityOption(
        "mirror",
        "魔法镜",
        "mirror",
        [MapEntityTypeId.MIRROR],
        { variant: "right-bottom" },
      ),
      entityOption(
        "trap",
        "陷阱",
        "trap",
        [MapEntityTypeId.TRAP],
        { active: true },
      ),
      entityOption(
        "color-switch",
        "彩色开关",
        "color-switch",
        [MapEntityTypeId.COLOR_SWITCH, MapEntityTypeId.COLOR_BLOCK],
        { color: "yellow", state: "state-1" },
      ),
      entityOption("mower", "割草机", "mower", [
        MapEntityTypeId.MOWER,
        MapEntityTypeId.GAS,
        MapEntityTypeId.MOWER_PARKING,
        MapEntityTypeId.HIGH_GRASS,
      ]),
      entityOption("beanstalk", "魔豆藤", "beanstalk", [
        MapEntityTypeId.BEAN,
        MapEntityTypeId.BEAN_FIELD,
        MapEntityTypeId.BEANSTALK,
      ]),
      entityOption(
        "dragon",
        "龙",
        "dragon",
        [MapEntityTypeId.DRAGON],
        { direction: "left" },
      ),
      entityOption("plank", "木板", "plank", [MapEntityTypeId.PLANK]),
      entityOption("whirlwind", "龙卷风 / 风筝", "whirlwind", [
        MapEntityTypeId.WHIRLWIND,
        MapEntityTypeId.KITE,
        MapEntityTypeId.LANDING,
      ]),
      entityOption("ice-block", "冰块", "ice-block", [
        MapEntityTypeId.ICE_BLOCK,
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
        .filter((option) => matches(option.match, entityTypes, entitySet, counts))
        .map((option) => option.id),
    ]),
  );
}

function countOption(id, min, max) {
  return {
    id,
    name: id,
    icon: entityIcon(MapEntityTypeId.CARROT),
    match: {
      type: "entity-count",
      entityType: MapEntityTypeId.CARROT,
      min,
      ...(max === undefined ? {} : { max }),
    },
  };
}

function entityOption(id, name, iconType, entityTypes, iconFields = {}) {
  return {
    id,
    name,
    icon: entityIcon(iconType, iconFields),
    match: { type: "entity-any", entityTypes },
  };
}

function entityIcon(type, fields = {}) {
  return { type: "entity", entity: { type, ...fields } };
}

function matches(match, entityTypes, entitySet, counts) {
  if (match.type === "entity-any") {
    return match.entityTypes.some((type) => entitySet.has(type));
  }
  let count = counts.get(match.entityType);
  if (count === undefined) {
    count = entityTypes.filter((type) => type === match.entityType).length;
    counts.set(match.entityType, count);
  }
  return count >= match.min && (match.max === undefined || count <= match.max);
}
