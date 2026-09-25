import { WEB_SHORTCUTS } from "./keyboard/shortcuts.js";
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
    productName: webT("brand.name"),
    productNameVisible: true,
    productNameVisibleOnNarrow: true,
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
    productName: webT("brand.name"),
    productNameVisible,
    contextName,
    menu: [
      { label: webT("nav.home"), href: "/" },
      {
        label: webT("nav.explore"),
        href: "/explore",
        active: activeHref === "/explore",
      },
      {
        label: webT("nav.adventure"),
        href: "/adventure",
        active: activeHref === "/adventure",
      },
      {
        label: webT("nav.editor"),
        href: "/edit",
        active: activeHref === "/edit",
      },
    ],
  };
}

export function globalActions(options: { languageSwitch?: boolean } = {}): ShellAction[] {
  return [
    ...(options.languageSwitch
      ? [translatedGlobalAction("language", "language", "shell.switchLanguage")]
      : []),
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
    title: webT("shell.openGithub"),
    href: PROJECT_REPOSITORY_URL,
    external: true,
    collapse: "keep",
  };
}

export function localizeGlobalActions(actions: readonly ShellAction[]): void {
  for (const action of actions) {
    const key = globalActionTranslationKey(action.id);
    if (!key) continue;
    const title = webT(key);
    action.label = action.id === "language" ? webT("shell.languageTarget") : title;
    action.title = title;
  }
}

function translatedGlobalAction(
  id: "music" | "language" | "settings" | "help",
  icon: NonNullable<ShellAction["icon"]>,
  key: WebTranslationKey,
): ShellAction {
  const title = webT(key);
  return {
    id,
    icon,
    label: id === "language" ? webT("shell.languageTarget") : title,
    title,
    ...(id === "music" || id === "help" ? { shortcut: WEB_SHORTCUTS[id].label } : {}),
    collapse: id === "music" || id === "language" ? "keep" : "overflow",
  };
}

function globalActionTranslationKey(id: string): WebTranslationKey | null {
  if (id === "music") return "shell.music";
  if (id === "language") return "shell.switchLanguage";
  if (id === "settings") return "shell.settings";
  if (id === "help") return "shell.help";
  return null;
}
