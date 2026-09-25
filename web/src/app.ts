import { BobbyApp } from "./app/BobbyApp.js";
import {
  initializeWebI18n,
  resolveBrowserLocale,
} from "./i18n/webI18n.js";
import { installRuntimeSeo } from "./seo/runtimeSeo.js";
import { initializeWebSettings, updateWebSettings } from "./storage/settingsStorage.js";
import { initializeWebTheme } from "./theme/webTheme.js";
import { homeLocale } from "./app/homeRoutes.js";
import { localRoutePath } from "./app/routes.js";
import "../../assets/ui/fonts/jersey-10/font.css";
import "../style.css";
import "../game-ui.css";

const browserLocales = navigator.languages.length
  ? navigator.languages
  : [navigator.language];
const settings = initializeWebSettings({
  locale: resolveBrowserLocale(browserLocales),
  screenControlEnabled: window.matchMedia("(pointer: coarse)").matches,
});
const entryLocale = homeLocale(localRoutePath()) ?? settings.locale;
if (entryLocale !== settings.locale)
  updateWebSettings((current) => ({ ...current, locale: entryLocale }));
await initializeWebI18n(entryLocale);
initializeWebTheme(settings.theme);
installRuntimeSeo();
const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("#app not found");
const app = new BobbyApp(root);
void app.start();
