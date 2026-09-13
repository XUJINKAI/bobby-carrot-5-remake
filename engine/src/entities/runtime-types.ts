import type { EntityType } from "@bobby/model";

/** 只由 Engine 在运行过程中生成，不能进入 LevelMap 的内部 Entity 身份。 */
export const RuntimeEntityTypeId = {
  SHOVEL_CLEARED_GROUND: "shovel-cleared-ground",
  CONSUMED_CARROT: "consumed-carrot",
  FIREBALL: "fireball",
  BEANSTALK_MID: "beanstalk-mid",
  BEANSTALK_BASE: "beanstalk-base",
  BEAN_SPROUT: "bean-sprout",
  TIMED_CHALLENGE: "timed-challenge",
} as const satisfies Record<string, EntityType>;
