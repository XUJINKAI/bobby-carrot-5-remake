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
    "adventure.bonusKey.reusableOwned": "你的永久钥匙可以直接打开这把锁。",
    "adventure.bonusKey.singleUseHeld": "你已经拿着一把单次钥匙了。",
    "adventure.bonusKey.trialGranted": "第一次免费送你一把体验钥匙。找到锁以后，倒计时才会开始！",
    "adventure.bonusKey.purchased": "成交！这把钥匙只够开一次锁。",
    "adventure.bonusKey.insufficient": "Bonus Coin 不足；这把单次钥匙需要 {price} 枚。",
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
    "adventure.bonusKey.reusableOwned": "Your reusable key can open this lock directly.",
    "adventure.bonusKey.singleUseHeld": "You are already carrying a single-use key.",
    "adventure.bonusKey.trialGranted": "Your first trial key is free. The countdown starts only after you open the lock.",
    "adventure.bonusKey.purchased": "Deal! This key opens one lock.",
    "adventure.bonusKey.insufficient": "Not enough Bonus Coins; a single-use key costs {price}.",
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
