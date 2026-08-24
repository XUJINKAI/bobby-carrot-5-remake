import type { ObjectType, TerrainType } from "../data/types.js";
import { ObjectId, Terrain, type Direction } from "./ids.js";
import { markerBehavior, type TileBehavior } from "./behaviors.js";
import { CLOUD_INFO } from "./mechanic-links.js";
import type { TileDefinition, TileTrait } from "./definition-types.js";

interface DefinitionAugmentPorts {
  defineObject(
    id: ObjectType,
    category: string,
    traits: TileTrait[],
    behaviors: TileBehavior[],
  ): void;
  getObject(id: ObjectType): TileDefinition<ObjectType>;
  setObject(definition: TileDefinition<ObjectType>): void;
  defineTerrain(
    id: TerrainType,
    category: string,
    traits: TileTrait[],
    behaviors: TileBehavior[],
  ): void;
  getTerrain(id: TerrainType): TileDefinition<TerrainType>;
}

export function applyDefinitionAugments(ports: DefinitionAugmentPorts): void {
  const blockingObjects: ObjectType[] = [
    ObjectId.EGG_NEST_FILLED,
    ObjectId.WINDMILL_UP,
    ObjectId.WINDMILL_DOWN,
    ObjectId.WINDMILL_LEFT,
    ObjectId.WINDMILL_RIGHT,
    ObjectId.PLANK_CRUMBLING,
    ObjectId.PLANK_FRAGMENT,
    ObjectId.DRAGON_HEAD_BASE,
    ObjectId.SANDMAN,
    ObjectId.DREAM_MACHINE,
    ObjectId.ICE_BLOCK,
    ObjectId.BEAVER_BASE,
    ObjectId.SANDMAN_BODY,
    ObjectId.DREAM_MACHINE_BODY,
    ObjectId.BEAVER_BODY,
    ObjectId.FENCE_1,
    ObjectId.FENCE_2,
    ObjectId.FENCE_3,
    ObjectId.FENCE_4,
    ObjectId.FENCE_5,
    ObjectId.FENCE_6,
  ];
  for (const id of blockingObjects)
    ports.defineObject(
      id,
      "blocking-object",
      ["blocking"],
      [markerBehavior("blocks-passage", "默认阻挡 Bobby 通过")],
    );
  for (const [id] of CLOUD_INFO) {
    const current = ports.getObject(id)!;
    ports.setObject({
      ...current,
      traits: [
        ...new Set([
          ...current.traits,
          "dynamic",
          "dynamic-cloud",
        ] as TileTrait[]),
      ],
      behaviors: [
        markerBehavior("dynamic-cloud", "由 World 动态实体系统按风场移动"),
      ],
    });
  }
  {
    const current = ports.getObject(ObjectId.LEAF)!;
    ports.setObject({
      ...current,
      traits: [
        ...new Set([
          ...current.traits,
          "dynamic",
          "dynamic-leaf",
        ] as TileTrait[]),
      ],
      behaviors: [
        markerBehavior(
          "dynamic-leaf",
          "由 World 动态实体系统按水流/玩家方向漂流",
        ),
      ],
    });
  }
  for (const id of [
    ObjectId.BEANSTALK_TIP,
    ObjectId.BEANSTALK_MID,
    ObjectId.BEANSTALK_BASE,
  ]) {
    const current = ports.getObject(id)!;
    ports.setObject({
      ...current,
      traits: [...new Set([...current.traits, "climbable"] as TileTrait[])],
    });
  }
  for (const id of [
    ObjectId.CLOUD_GRID_RED,
    ObjectId.CLOUD_GRID_PURPLE,
    ObjectId.CLOUD_GRID_GREEN,
  ]) {
    const current = ports.getObject(id)!;
    ports.setObject({
      ...current,
      traits: [...new Set([...current.traits, "cloud-grid"] as TileTrait[])],
    });
  }
  for (const id of [ObjectId.DRAGON_HEAD_BASE, ObjectId.DRAGON_BODY]) {
    const current = ports.getObject(id)!;
    ports.setObject({
      ...current,
      traits: [
        ...new Set([
          ...current.traits,
          "dragon-fire-blocking",
          ...(id === ObjectId.DRAGON_HEAD_BASE
            ? ["dragon-head" as TileTrait]
            : []),
        ] as TileTrait[]),
      ],
    });
  }
  {
    const current = ports.getObject(ObjectId.ICE_BLOCK)!;
    ports.setObject({
      ...current,
      traits: [
        ...new Set([...current.traits, "dragon-fire-melt"] as TileTrait[]),
      ],
    });
  }
  ports.defineTerrain(
    Terrain.START,
    "marker",
    ["start"],
    [markerBehavior("start-position", "Bobby 的出生点")],
  );
  ports.defineTerrain(
    Terrain.HIGH_GRASS_OBJECTIVE,
    "mower",
    ["terrain-passage-override", "hidden-objective"],
    ports.getTerrain(Terrain.HIGH_GRASS_OBJECTIVE).behaviors as TileBehavior[],
  );
  for (const [id] of [
    [ObjectId.WINDMILL_UP, "up"],
    [ObjectId.WINDMILL_DOWN, "down"],
    [ObjectId.WINDMILL_LEFT, "left"],
    [ObjectId.WINDMILL_RIGHT, "right"],
  ] as Array<[ObjectType, Direction]>) {
    const current = ports.getObject(id)!;
    ports.setObject({
      ...current,
      traits: [...new Set([...current.traits, "windmill"] as TileTrait[])],
    });
  }
}
