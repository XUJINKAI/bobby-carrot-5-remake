import { BobbyApp } from "./app/BobbyApp.js";
import {
  initializeWebI18n,
  resolveBrowserLocale,
} from "./i18n/webI18n.js";
import { installRuntimeSeo } from "./seo/runtimeSeo.js";
import { initializeWebSettings } from "./storage/settingsStorage.js";
import { initializeWebTheme } from "./theme/webTheme.js";
import "./shared/fonts/jersey-10/font.css";
import "../style.css";
import "../game-ui.css";
import "../../editor/style.css";

const browserLocales = navigator.languages.length
  ? navigator.languages
  : [navigator.language];
const settings = initializeWebSettings({
  locale: resolveBrowserLocale(browserLocales),
  screenControlEnabled: window.matchMedia("(pointer: coarse)").matches,
});
initializeWebI18n(settings.locale);
initializeWebTheme(settings.theme);
installRuntimeSeo();
const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("#app not found");
const app = new BobbyApp(root);
await app.start();
