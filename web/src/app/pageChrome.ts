import { siteUrl } from "../services/assets/gameAssets.js";
import type {
  HelpDescriptor,
  ShellAction,
  ShellIdentity,
} from "../shell/shellBridge.js";

export function homeIdentity(): ShellIdentity {
  return {
    icon: siteUrl("assets/art/hd/icon.png"),
    productName: "Bobby Carrot 5 Remake",
    productNameVisible: true,
    href: "/",
  };
}

export function pageIdentity(
  contextName: string,
  activeHref: "/adventure" | "/explore" | "/edit" | "/embed",
  productNameVisible = true,
): ShellIdentity {
  return {
    icon: siteUrl("assets/art/hd/icon.png"),
    productName: "Bobby Carrot 5 Remake",
    productNameVisible,
    contextName,
    menu: [
      { label: "首页", href: "/" },
      {
        label: "冒险模式",
        href: "/adventure",
        active: activeHref === "/adventure",
      },
      {
        label: "自由探索模式",
        href: "/explore",
        active: activeHref === "/explore",
      },
      {
        label: "编辑器模式",
        href: "/edit",
        active: activeHref === "/edit",
      },
    ],
  };
}

export function globalActions(): ShellAction[] {
  return [
    {
      id: "music",
      icon: "music",
      label: "音乐",
      title: "音乐",
      collapse: "overflow",
    },
    {
      id: "settings",
      icon: "settings",
      label: "设置",
      title: "设置",
      collapse: "overflow",
    },
    {
      id: "help",
      icon: "help",
      label: "帮助",
      title: "帮助",
      collapse: "overflow",
    },
  ];
}

export const BROWSE_HELP: HelpDescriptor = {
  title: "浏览帮助",
  sections: [
    {
      lines: ["选择地图集合后点击地图即可游玩。", "筛选条件只作用于原版关卡。"],
    },
  ],
};

export const GAME_HELP: HelpDescriptor = {
  title: "游玩帮助",
  sections: [
    {
      lines: [
        "WASD / 方向键：移动",
        "拖动画面：查看地图",
        "滚轮或双指：缩放地图",
      ],
    },
  ],
};

export const EDITOR_HELP: HelpDescriptor = {
  title: "编辑器帮助",
  sections: [
    {
      lines: [
        "左键放置 Terrain 或 Object",
        "右键 / Del：删除完整对象",
        "Q / E：切换对象形态",
        "滚轮：切换形态或缩放地图",
      ],
    },
  ],
};
