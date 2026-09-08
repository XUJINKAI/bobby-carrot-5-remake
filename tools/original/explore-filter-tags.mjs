import { MapEntityTypeId } from "@bobby/model";

/**
 * Original Explore 标签的人工审阅入口。
 *
 * Adapter 已经把原版图块转换成 canonical Entity；这里逐表声明每个筛选标签需要
 * 扫描哪些 Entity。一个标签命中任意一项证据即可成立，表外 Entity 不参与推断。
 * `snow-cloud` 是雪地与星空共用的底板，因此场景必须分别由 `snow` 和 `starfield`
 * 确认，不能从共用底板猜测。
 */
export const ORIGINAL_EXPLORE_TAG_RULES = {
  items: [
    tag("shovel", MapEntityTypeId.SHOVEL_PICKUP),
    tag("gas", MapEntityTypeId.GAS),
    tag("bean", MapEntityTypeId.BEAN),
    tag("kite", MapEntityTypeId.KITE),
    tag("golden-carrot", MapEntityTypeId.GOLDEN_CARROT),
    tag("bonus-coin", MapEntityTypeId.BONUS_COIN),
  ],
  scenes: [
    tag("grassland", MapEntityTypeId.GRASS),
    tag(
      "water",
      MapEntityTypeId.WATER,
      MapEntityTypeId.WATERFALL,
      MapEntityTypeId.TIDE,
    ),
    tag("snow", MapEntityTypeId.SNOW),
    tag("starfield", MapEntityTypeId.STARFIELD),
    tag("desert", MapEntityTypeId.SAND),
  ],
  mechanics: [
    tag("tide", MapEntityTypeId.TIDE, MapEntityTypeId.TIDE_SWITCH),
    tag("speed", MapEntityTypeId.SPEED, MapEntityTypeId.SPEED_SWITCH),
    tag(
      "carousel",
      MapEntityTypeId.CAROUSEL,
      MapEntityTypeId.CAROUSEL_SWITCH,
    ),
    tag(
      "wind",
      MapEntityTypeId.WIND_SWITCH,
      MapEntityTypeId.WINDMILL,
      MapEntityTypeId.CLOUD,
      MapEntityTypeId.CLOUD_PARKING,
    ),
    tag("mirror", MapEntityTypeId.MIRROR),
    tag("trap", MapEntityTypeId.TRAP),
    tag(
      "color-switch",
      MapEntityTypeId.COLOR_SWITCH,
      MapEntityTypeId.COLOR_BLOCK,
    ),
    tag(
      "mower",
      MapEntityTypeId.MOWER,
      MapEntityTypeId.GAS,
      MapEntityTypeId.MOWER_PARKING,
      MapEntityTypeId.HIGH_GRASS,
    ),
    tag(
      "beanstalk",
      MapEntityTypeId.BEAN,
      MapEntityTypeId.BEAN_FIELD,
      MapEntityTypeId.BEANSTALK,
    ),
    tag("dragon", MapEntityTypeId.DRAGON),
    tag("plank", MapEntityTypeId.PLANK),
    tag(
      "whirlwind",
      MapEntityTypeId.WHIRLWIND,
      MapEntityTypeId.KITE,
      MapEntityTypeId.LANDING,
    ),
    tag("ice-block", MapEntityTypeId.ICE_BLOCK),
  ],
};

export function levelFeatures(level) {
  const entityTypes = level.entities.map((entity) => entity.type);
  const entitySet = new Set(entityTypes);

  return {
    carrotCount: entityTypes.filter(
      (type) => type === MapEntityTypeId.CARROT,
    ).length,
    specialItems: matchingTags(entitySet, ORIGINAL_EXPLORE_TAG_RULES.items),
    scenes: matchingTags(entitySet, ORIGINAL_EXPLORE_TAG_RULES.scenes),
    mechanics: matchingTags(entitySet, ORIGINAL_EXPLORE_TAG_RULES.mechanics),
  };
}

function tag(id, ...entityTypes) {
  return { id, entityTypes };
}

function matchingTags(entitySet, rules) {
  return rules
    .filter((rule) => rule.entityTypes.some((type) => entitySet.has(type)))
    .map((rule) => rule.id);
}
