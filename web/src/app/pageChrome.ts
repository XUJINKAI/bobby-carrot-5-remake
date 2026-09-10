import { siteUrl } from "../services/assets/gameAssets.js";
import { webT, type WebTranslationKey } from "../i18n/webI18n.js";
import type {
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
    statusText: "开发中",
    href: "/",
  };
}

export function pageIdentity(
  contextName: string,
  activeHref: "/adventure" | "/explore" | "/edit" | "/embed" | "/import/v1",
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
    translatedGlobalAction("music", "sound-on", "shell.music"),
    translatedGlobalAction("settings", "settings", "shell.settings"),
    translatedGlobalAction("help", "help", "shell.help"),
  ];
}

export function musicActionIcon(
  musicEnabled: boolean,
): "sound-on" | "sound-off" {
  return musicEnabled ? "sound-on" : "sound-off";
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
    collapse: "keep",
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

function translatedGlobalAction(
  id: "music" | "settings" | "help",
  icon: NonNullable<ShellAction["icon"]>,
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
