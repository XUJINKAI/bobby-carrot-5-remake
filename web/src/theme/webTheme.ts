import type { WebTheme } from "../storage/contracts.js";

export type { WebTheme } from "../storage/contracts.js";
const THEME_COLORS: Record<WebTheme, string> = {
  bobby: "#143678",
  fc: "#000000",
};
let activeTheme: WebTheme = "bobby";

export function initializeWebTheme(theme: WebTheme): WebTheme {
  activeTheme = theme;
  applyTheme(activeTheme);
  return activeTheme;
}

export function getWebTheme(): WebTheme {
  return activeTheme;
}

export function setWebTheme(theme: WebTheme): void {
  activeTheme = theme;
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent<WebTheme>("web-theme-change", { detail: theme }));
}

function applyTheme(theme: WebTheme): void {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
}
