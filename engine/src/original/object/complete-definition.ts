import type { ObjectType } from "../../data/types.js";
import { markerBehavior, touchBehavior } from "../../mechanics/behaviors.js";
import type { TileDefinition, TileTrait } from "../../mechanics/definition-types.js";
import { ObjectId } from "../../mechanics/ids.js";
import { CLOUD_INFO } from "../../mechanics/mechanic-links.js";

const BLOCKING = new Set<ObjectType>([
  ObjectId.EGG_NEST_FILLED, ObjectId.WINDMILL_UP, ObjectId.WINDMILL_DOWN,
  ObjectId.WINDMILL_LEFT, ObjectId.WINDMILL_RIGHT, ObjectId.PLANK_CRUMBLING,
  ObjectId.PLANK_FRAGMENT, ObjectId.DRAGON_HEAD_BASE, ObjectId.SANDMAN,
  ObjectId.DREAM_MACHINE, ObjectId.ICE_BLOCK, ObjectId.BEAVER_BASE,
  ObjectId.SANDMAN_BODY, ObjectId.DREAM_MACHINE_BODY, ObjectId.BEAVER_BODY,
  ObjectId.FENCE_1, ObjectId.FENCE_2, ObjectId.FENCE_3, ObjectId.FENCE_4,
  ObjectId.FENCE_5, ObjectId.FENCE_6,
]);
const CLOUDS = new Set<ObjectType>(CLOUD_INFO.map(([id]) => id));
const CLIMBABLE = new Set<ObjectType>([
  ObjectId.BEANSTALK_TIP, ObjectId.BEANSTALK_MID, ObjectId.BEANSTALK_BASE,
]);
const CLOUD_GRIDS = new Set<ObjectType>([
  ObjectId.CLOUD_GRID_RED, ObjectId.CLOUD_GRID_PURPLE, ObjectId.CLOUD_GRID_GREEN,
]);
const WINDMILLS = new Set<ObjectType>([
  ObjectId.WINDMILL_UP, ObjectId.WINDMILL_DOWN,
  ObjectId.WINDMILL_LEFT, ObjectId.WINDMILL_RIGHT,
]);

/** 原版 Object 在进入 Registry 前组装为当前完整 Definition。 */
export function completeOriginalObjectDefinition(
  source: TileDefinition<ObjectType>,
): TileDefinition<ObjectType> {
  const traits = new Set<TileTrait>(source.traits);
  if (BLOCKING.has(source.id)) traits.add("blocking");
  if (CLOUDS.has(source.id)) traits.add("dynamic-cloud");
  if (CLOUDS.has(source.id) || source.id === ObjectId.LEAF) traits.add("dynamic");
  if (source.id === ObjectId.LEAF) traits.add("dynamic-leaf");
  if (CLIMBABLE.has(source.id)) traits.add("climbable");
  if (CLOUD_GRIDS.has(source.id)) traits.add("cloud-grid");
  if (source.id === ObjectId.DRAGON_HEAD_BASE || source.id === ObjectId.DRAGON_BODY)
    traits.add("dragon-fire-blocking");
  if (source.id === ObjectId.DRAGON_HEAD_BASE) traits.add("dragon-head");
  if (source.id === ObjectId.ICE_BLOCK) traits.add("dragon-fire-melt");
  if (WINDMILLS.has(source.id)) traits.add("windmill");

  let behaviors = source.behaviors;
  if (source.id === ObjectId.SANDMAN || source.id === ObjectId.SANDMAN_BODY)
    behaviors = [...behaviors, touchBehavior(
      "sandman-dialog",
      "触碰 Sandman 时请求展示对象实例对白",
      (object) => ({
        kind: "dialog",
        ...(object.properties?.dialogId !== undefined
          ? { messageId: object.properties.dialogId }
          : {}),
        ...(object.properties?.dialogue !== undefined
          ? { text: object.properties.dialogue }
          : {}),
      }),
    )];
  if (CLOUDS.has(source.id))
    behaviors = [markerBehavior("dynamic-cloud", "由 World 动态实体系统按风场移动")];
  if (source.id === ObjectId.LEAF)
    behaviors = [markerBehavior("dynamic-leaf", "由 World 动态实体系统按水流/玩家方向漂流")];

  const authoring = source.authoring ?? { palette: true };
  if (source.id === ObjectId.CRUMBLY_ROCK)
    return {
      ...source,
      presentation: { name: "Crumbly Rock", category: "mower" },
      traits: [...traits],
      behaviors,
      authoring: {
        ...authoring,
        traits: [{ trait: "pushable", label: "可推动" }],
      },
    };
  const properties = [...(authoring.properties ?? [])];
  if (source.id === ObjectId.SANDMAN)
    properties.push(
      {
        key: "dialogId", kind: "string", label: "对白 ID",
        placeholder: "例如 custom.sandman.greeting",
      },
      {
        key: "dialogue", kind: "string", label: "自定义对白", multiline: true,
        maxLength: 1000, placeholder: "可选的即时显示文本",
      },
    );
  if (source.id === ObjectId.LOCK)
    properties.push({
      key: "timedChallengeMs", kind: "string", label: "限时挑战（毫秒）",
      placeholder: "例如 60000；留空表示不开启",
    });
  return {
    ...source,
    traits: [...traits],
    behaviors,
    authoring: {
      ...authoring,
      ...(properties.length > 0 ? { properties } : {}),
    },
  };
}
