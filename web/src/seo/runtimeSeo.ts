import { mapAssetUrl } from "../app/routes.js";
import { siteUrl } from "../services/assets/gameAssets.js";

interface SeoDescriptor {
  title: string;
  description: string;
  canonicalPath: string;
  index: boolean;
}

const SITE_ORIGIN = (
  import.meta.env.VITE_SITE_ORIGIN || "https://bc5r.xujinkai.net"
).replace(/\/+$/, "");
const BRAND = "兔子波比5重制版";
const OG_IMAGE = `${SITE_ORIGIN}/assets/art/hd/title.png`;

export function installRuntimeSeo(): () => void {
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);
  let generation = 0;

  const sync = (): void => {
    const current = ++generation;
    void resolveCurrentSeo().then((descriptor) => {
      if (current !== generation) return;
      applySeo(descriptor);
    });
  };

  history.pushState = (...args) => {
    originalPushState(...args);
    sync();
  };
  history.replaceState = (...args) => {
    originalReplaceState(...args);
    sync();
  };
  window.addEventListener("popstate", sync);
  window.addEventListener("hashchange", sync);
  sync();

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", sync);
    window.removeEventListener("hashchange", sync);
  };
}

async function resolveCurrentSeo(): Promise<SeoDescriptor> {
  const path = localRoutePath();
  if (path === "/")
    return descriptor(
      "兔子波比5重制版 | Bobby Carrot 5 Remake",
      "在浏览器中游玩《兔子波比5》重制版：复刻原版 40 章 400 个关卡与 80 个奖励关，并提供自由探索、地图编辑器、分享与网页内嵌。",
      "/",
    );
  if (path === "/adventure")
    return descriptor(
      `冒险模式 | ${BRAND}`,
      "按原版章节结构体验《兔子波比5》冒险模式，推进关卡、保存进度、获得奖励，并体验海狸商店、夜间列车等经典冒险机制。",
      path,
    );
  if (path === "/adventure/chapters")
    return descriptor(
      `章节选择 | 冒险模式 | ${BRAND}`,
      "浏览《兔子波比5》冒险模式的 40 个章节，查看章节难度与完成进度并继续挑战。",
      path,
    );
  if (path === "/adventure/night-train")
    return descriptor(
      `夜间列车 | 冒险模式 | ${BRAND}`,
      "进入《兔子波比5》冒险模式的夜间列车，前往 Dream Machine、Cloud 9 等特殊区域。",
      path,
    );
  if (path === "/adventure/beaver-shop")
    return descriptor(
      `Beaver Shop | 冒险模式 | ${BRAND}`,
      "进入《兔子波比5》冒险模式的 Beaver Shop 特殊场景。",
      path,
      false,
    );
  if (path === "/adventure/night-train/dream-machine")
    return descriptor(
      `Dream Machine | 冒险模式 | ${BRAND}`,
      "进入《兔子波比5》冒险模式的 Dream Machine 特殊场景。",
      path,
      false,
    );
  if (path === "/adventure/night-train/cloud-9")
    return descriptor(
      `Cloud 9 | 冒险模式 | ${BRAND}`,
      "进入《兔子波比5》冒险模式的 Cloud 9 特殊场景。",
      path,
      false,
    );
  if (path.startsWith("/adventure/chapter/"))
    return resolveAdventureChapterSeo(path);
  if (path.startsWith("/adventure/play/")) {
    const id = decodeURIComponent(path.split("/").pop() ?? "").toUpperCase();
    return descriptor(
      `关卡 ${id} | 冒险模式 | ${BRAND}`,
      `游玩《兔子波比5》冒险模式关卡 ${id}。`,
      path,
      false,
    );
  }
  if (path === "/explore" || path === "/explore/original")
    return resolveCollectionSeo("original", "/explore");
  if (path.startsWith("/explore/play/")) return resolveExploreMapSeo(path);
  if (path.startsWith("/explore/")) {
    const collection = decodeURIComponent(path.split("/")[2] ?? "").toLowerCase();
    return resolveCollectionSeo(collection, path);
  }
  if (path === "/edit")
    return descriptor(
      "兔子波比5地图编辑器 | 创建、试玩与分享地图",
      "在浏览器中使用《兔子波比5》的地形、机关和道具创建自己的地图，随时试玩，并通过链接、文件或网页内嵌分享。",
      "/edit",
    );
  if (path === "/embed")
    return descriptor(
      "网页内嵌 | 将兔子波比5地图嵌入你的网站",
      "使用 BC5R Embed 将《兔子波比5》地图嵌入其他网页，自定义地图、尺寸、音频和显示配置。",
      path,
    );
  if (path === "/settings")
    return descriptor(
      `设置 | ${BRAND}`,
      "调整 Bobby Carrot 5 Remake 的语言、主题、音乐和控制选项。",
      path,
      false,
    );
  if (path === "/import/v1")
    return descriptor(
      `导入分享数据 | ${BRAND}`,
      "导入 Bobby Carrot 5 Remake 分享数据。",
      path,
      false,
    );
  return descriptor(
    `页面不存在 | ${BRAND}`,
    "请求的 Bobby Carrot 5 Remake 页面不存在。",
    path,
    false,
  );
}

async function resolveAdventureChapterSeo(path: string): Promise<SeoDescriptor> {
  const chapterId = decodeURIComponent(path.split("/").pop() ?? "");
  try {
    const adventure = await fetchJson<{
      chapters: Array<{ id: string; name: string; description: string }>;
    }>(siteUrl("assets/adventure/index.json"));
    const chapter = adventure.chapters.find((entry) => entry.id === chapterId);
    if (!chapter) throw new Error("chapter not found");
    const chapterNumber = String(Number(chapter.id)).padStart(2, "0");
    return descriptor(
      `第 ${chapterNumber} 章：${chapter.name} | ${BRAND}`,
      chapter.description || `浏览《兔子波比5》冒险模式第 ${chapterNumber} 章的关卡。`,
      path,
    );
  } catch {
    return descriptor(`章节 | 冒险模式 | ${BRAND}`, "浏览《兔子波比5》冒险模式章节。", path);
  }
}

async function resolveCollectionSeo(
  collectionId: string,
  canonicalPath: string,
): Promise<SeoDescriptor> {
  try {
    const collection = await fetchJson<{
      id: string;
      name: string;
      description: string;
    }>(siteUrl(`assets/maps/${collectionId}/index.json`));
    return descriptor(
      collection.id === "original"
        ? `自由探索 | ${BRAND}`
        : `${collection.name} | 自由探索 | ${BRAND}`,
      collection.description || `浏览并在线游玩「${collection.name}」地图合集。`,
      canonicalPath,
    );
  } catch {
    return descriptor(`自由探索 | ${BRAND}`, "浏览并在线游玩 Bobby Carrot 5 Remake 地图。", canonicalPath);
  }
}

async function resolveExploreMapSeo(path: string): Promise<SeoDescriptor> {
  const parts = path.split("/").filter(Boolean);
  const collection = decodeURIComponent(parts[2] ?? "").toLowerCase();
  const id = decodeURIComponent(parts[3] ?? "").toLowerCase();
  if (collection === "imported")
    return descriptor(
      `导入地图 | ${BRAND}`,
      "游玩临时导入的 Bobby Carrot 5 Remake 地图。",
      path,
      false,
    );
  try {
    const document = await fetchJson<{
      meta: { name: string; description?: string; author?: string };
    }>(siteUrl(mapAssetUrl(collection, id)));
    const title = normalizeMapTitle(document.meta.name, id);
    const author = document.meta.author ? `，作者 ${document.meta.author}` : "";
    const detail = document.meta.description ? `。${document.meta.description}` : "。";
    return descriptor(
      `${title} | ${BRAND}`,
      `在线游玩「${document.meta.name}」${author}${detail}`,
      path,
    );
  } catch {
    return descriptor(
      `${id.toUpperCase()} | ${BRAND}`,
      `在线游玩 Bobby Carrot 5 Remake 地图 ${id.toUpperCase()}。`,
      path,
    );
  }
}

function descriptor(
  title: string,
  description: string,
  canonicalPath: string,
  index = true,
): SeoDescriptor {
  return { title, description, canonicalPath, index };
}

function normalizeMapTitle(name: string, id: string): string {
  const trimmed = name.trim();
  return trimmed.toLowerCase() === id.toLowerCase()
    ? trimmed
    : `${trimmed} · ${id.toUpperCase()}`;
}

function applySeo(value: SeoDescriptor): void {
  const canonical = `${SITE_ORIGIN}${value.canonicalPath === "/" ? "/" : value.canonicalPath}`;
  document.title = value.title;
  setMeta("name", "description", value.description);
  setMeta("name", "robots", value.index ? "index,follow" : "noindex,follow");
  setLink("canonical", canonical);
  setMeta("property", "og:site_name", "Bobby Carrot 5 Remake");
  setMeta("property", "og:type", "website");
  setMeta("property", "og:title", value.title);
  setMeta("property", "og:description", value.description);
  setMeta("property", "og:url", canonical);
  setMeta("property", "og:image", OG_IMAGE);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", value.title);
  setMeta("name", "twitter:description", value.description);
  setMeta("name", "twitter:image", OG_IMAGE);
}

function setMeta(attribute: "name" | "property", key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

function setLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.append(element);
  }
  element.href = href;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`SEO metadata fetch failed: ${response.status}`);
  return response.json() as Promise<T>;
}

function localRoutePath(): string {
  const basePath = new URL(document.baseURI).pathname.replace(/\/+$/, "");
  const localPath =
    basePath && basePath !== "/" && location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : location.pathname;
  return localPath.replace(/\/+$/, "") || "/";
}
