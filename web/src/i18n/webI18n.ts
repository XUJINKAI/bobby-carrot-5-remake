import {
  createTranslator,
  normalizeLocale,
  type Locale,
  type TranslationCatalog,
  type Translator,
} from "@bobby/i18n";

const WEB_CATALOGS = {
  "zh-CN": {
    "shell.music": "音乐",
    "shell.musicInteractionTip": "点击页面即可播放音乐",
    "shell.settings": "设置",
    "shell.help": "帮助",
    "settings.quickTitle": "快速设置",
    "settings.language": "语言",
    "settings.theme": "主题",
    "settings.themeBobby": "Bobby",
    "settings.themeFc": "FC",
    "settings.music": "音乐",
    "settings.musicFollowTheme": "跟随主题",
    "settings.musicModern": "现代",
    "settings.volume": "音量",
    "settings.more": "更多设置",
    "home.demo.sandmanFirst": "欢迎你，朋友，这是兔子波比5的复刻项目，走到终点继续冒险吧。",
    "home.demo.sandmanAgain": "去吧...",
  },
  en: {
    "shell.music": "Music",
    "shell.musicInteractionTip": "Click the page to play music",
    "shell.settings": "Settings",
    "shell.help": "Help",
    "settings.quickTitle": "Quick settings",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.themeBobby": "Bobby",
    "settings.themeFc": "FC",
    "settings.music": "Music",
    "settings.musicFollowTheme": "Follow theme",
    "settings.musicModern": "Modern",
    "settings.volume": "Volume",
    "settings.more": "More settings",
    "home.demo.sandmanFirst": "Welcome to Bobby Carrot 5 Remake! Take a few steps and continue your journey in the browser.",
    "home.demo.sandmanAgain": "This is the full Engine running here. Continue with Adventure, Explore, or the Editor from the left.",
  },
} satisfies Readonly<Record<Locale, TranslationCatalog>>;

export type WebTranslationKey = keyof (typeof WEB_CATALOGS)["zh-CN"];

let translator: Translator | null = null;

export function resolveBrowserLocale(browserLocales: readonly string[]): Locale {
  for (const candidate of browserLocales) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return "en";
}

export function initializeWebI18n(locale: Locale): Locale {
  ensureTranslator().setLocale(locale);
  document.documentElement.lang = locale;
  return locale;
}

export function getWebLocale(): Locale {
  return ensureTranslator().locale;
}

export function setWebLocale(locale: Locale): void {
  ensureTranslator().setLocale(locale);
  document.documentElement.lang = locale;
}

export function webT(key: WebTranslationKey): string {
  return ensureTranslator().t(key);
}

function ensureTranslator(): Translator {
  translator ??= createTranslator({
    locale: "zh-CN",
    fallbackLocale: "zh-CN",
    catalogs: WEB_CATALOGS,
  });
  return translator;
}
