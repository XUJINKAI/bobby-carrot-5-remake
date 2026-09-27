import { homeLocale } from "../app/homeRoutes.js";

const images = {
  "zh-CN": {
    path: "/assets/seo/og-preview-zh-CN.png",
    alt: "兔子波比5重制版：浏览器畅玩、地图编辑器与游戏画面",
    width: 1200,
    height: 630,
  },
  en: {
    path: "/assets/seo/og-preview-en.png",
    alt: "Bobby Carrot 5 Remake: browser play, map editor and gameplay",
    width: 1200,
    height: 630,
  },
};

export function shareImage(path, locale = "zh-CN") {
  // 首页语言由 URL 决定，与正文及 SEO 标题使用同一规则。
  return images[homeLocale(path) ?? locale];
}
