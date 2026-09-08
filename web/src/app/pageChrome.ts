import { siteUrl } from "../services/assets/gameAssets.js";
import { webT, type WebTranslationKey } from "../i18n/webI18n.js";
import type {
  HelpDescriptor,
  ShellAction,
  ShellIdentity,
} from "../shell/shellBridge.js";

export const PROJECT_REPOSITORY_URL =
  "https://github.com/XUJINKAI/bobby-carrot-5-remake";

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
    translatedGlobalAction("music", "music", "shell.music"),
    translatedGlobalAction("settings", "settings", "shell.settings"),
    translatedGlobalAction("help", "help", "shell.help"),
  ];
}

export function repositoryAction(): ShellAction {
  return {
    id: "github-repository",
    icon: "github",
    cornerIcon: "external",
    label: "GitHub",
    title: "打开 GitHub 仓库",
    href: PROJECT_REPOSITORY_URL,
    external: true,
    collapse: "overflow",
  };
}

export function localizeGlobalActions(actions: readonly ShellAction[]): void {
  for (const action of actions) {
    const key = globalActionTranslationKey(action.id);
    if (!key) continue;
    const label = webT(key);
    action.label = label;
    action.title = label;
  }
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
        "1 选择：单选或拖出矩形多选",
        "2 画笔：绘制当前素材；点入选择框可整块填充",
        "4 智能填充：Surface 连通区域填充",
        "Tab：切换 Palette / Surface",
        "Ctrl/Cmd+A：全选地图",
        "Delete / Backspace：删除选中的 Palette Entity",
        "Surface 右键：取样当前 Terrain / Variant",
        "Q / E：切换 Palette Entity 形态",
        "滚轮：切换形态或缩放地图",
      ],
    },
  ],
};

function translatedGlobalAction(
  id: "music" | "settings" | "help",
  icon: "music" | "settings" | "help",
  key: WebTranslationKey,
): ShellAction {
  const label = webT(key);
  return {
    id,
    icon,
    label,
    title: label,
    collapse: id === "music" ? "keep" : "overflow",
  };
}

function globalActionTranslationKey(id: string): WebTranslationKey | null {
  if (id === "music") return "shell.music";
  if (id === "settings") return "shell.settings";
  if (id === "help") return "shell.help";
  return null;
}
