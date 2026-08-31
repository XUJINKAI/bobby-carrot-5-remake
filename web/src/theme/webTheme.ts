export type WebTheme = "modern" | "retro";

const THEME_STORAGE_KEY = "bobby.theme";
const THEME_COLORS: Record<WebTheme, string> = {
  modern: "#0f141a",
  retro: "#143678",
};
let activeTheme: WebTheme = "modern";

export function resolveWebTheme(value: string | null | undefined): WebTheme {
  return value === "retro" ? "retro" : "modern";
}

export function initializeWebTheme(): WebTheme {
  activeTheme = resolveWebTheme(localStorage.getItem(THEME_STORAGE_KEY));
  applyTheme(activeTheme);
  return activeTheme;
}

export function getWebTheme(): WebTheme {
  return activeTheme;
}

export function setWebTheme(theme: WebTheme): void {
  activeTheme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

function applyTheme(theme: WebTheme): void {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
}
