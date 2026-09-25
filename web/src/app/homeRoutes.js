export const HOME_ROUTES = Object.freeze([
  { path: "/", locale: "zh-CN" },
  { path: "/en", locale: "en" },
]);

export function homeLocale(path) {
  const normalized = path.replace(/\/+$/, "") || "/";
  return HOME_ROUTES.find((route) => route.path === normalized)?.locale ?? null;
}

export function homePath(locale) {
  return locale === "en" ? "/en" : "/";
}
