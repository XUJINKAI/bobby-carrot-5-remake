import {
  applyLevelPatches,
  MapEntityTypeId,
  type LevelMap,
  type LevelPatch,
} from "@bobby/model";

const HOME_DEMO_PATCHES: readonly LevelPatch[] = [
  {
    operation: "set-fields",
    selector: { type: MapEntityTypeId.SANDMAN, x: 6, y: 6 },
    fields: { dialogue: [
      "欢迎你，这里是 兔子波比5重制版 项目。引擎是重新写的，支持很多新玩意儿，想必你已经看到了。",
      "冒险模式通过竖屏尽量还原原版冒险体验。自由探索和编辑器可以让你任意探索/编辑/分享地图。",
      "目前还在开发中，遇到问题可以提交到 GitHub，喜欢就收藏、分享、给个 GitHub star 吧~",
    ] },
  },
  {
    operation: "set-fields",
    selector: { type: MapEntityTypeId.SNOWMAN, x: 10, y: 6 },
    fields: { dialogue: [
      "嘿！你终于来了！",
      "如你所见，我现在会说话了！",
      "看到我身后的新玩意儿了没？哎呀妈呀老带劲儿了！",
      "走进去，快，快进去试试！",
    ] },
  },
  {
    operation: "set-fields",
    selector: { type: MapEntityTypeId.SNOWMAN, x: 4, y: 1 },
    fields: { dialogue: [
      "诶？你是怎么上来的？",
    ] },
  },
  {
    operation: "add",
    entity: {
      type: MapEntityTypeId.PORTAL,
      x: 11,
      y: 5,
      channel: "home-demo",
      color: "#ce36df",
    },
  },
  {
    operation: "add",
    entity: {
      type: MapEntityTypeId.PORTAL,
      x: 5,
      y: 2,
      channel: "home-demo",
      color: "#ce36df",
    },
  },
  {
    operation: "add",
    entity: { type: MapEntityTypeId.PUSHABLE_BOX, x: 7, y: 11 },
  },
  {
    operation: "add",
    entity: { type: MapEntityTypeId.PUSHABLE_BOX, x: 8, y: 11 },
  },
];

export function createHomeDemoLevel(level: LevelMap): LevelMap {
  return applyLevelPatches(level, HOME_DEMO_PATCHES);
}
