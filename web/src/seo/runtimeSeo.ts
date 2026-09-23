import { mapAssetUrl } from "../app/routes.js";
import { siteUrl } from "../services/assets/gameAssets.js";
import { getWebLocale } from "../i18n/webI18n.js";
import {
  ADVENTURE_SPECIAL_SCENES,
  adventureChapterSeoDescriptor,
  adventureLevelSeoDescriptor,
  adventureSceneSeoDescriptor,
  collectionSeoDescriptor,
  exploreMapSeoDescriptor,
  localizedSeoDescriptor,
  notFoundSeoDescriptor,
  staticSeoDescriptor,
  type SeoDescriptor,
} from "./seoDescriptors.js";

const SITE_ORIGIN = (
  import.meta.env.VITE_SITE_ORIGIN || "https://bc5r.xujinkai.net"
).replace(/\/+$/, "");
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
  window.addEventListener("web-locale-change", sync);
  sync();

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", sync);
    window.removeEventListener("hashchange", sync);
    window.removeEventListener("web-locale-change", sync);
  };
}

async function resolveCurrentSeo(): Promise<SeoDescriptor> {
  const path = localRoutePath();
  const staticDescriptor = staticSeoDescriptor(path);
  if (staticDescriptor) return staticDescriptor;

  const scene = Object.values(ADVENTURE_SPECIAL_SCENES).find(
    (candidate) => candidate.path === path,
  );
  if (scene) return adventureSceneSeoDescriptor(path, scene.name);

  if (path.startsWith("/adventure/chapter/"))
    return resolveAdventureChapterSeo(path);
  if (path.startsWith("/adventure/play/")) {
    const id = decodeURIComponent(path.split("/").pop() ?? "");
    return adventureLevelSeoDescriptor(path, id);
  }
  if (path === "/explore" || path === "/explore/original")
    return resolveCollectionSeo("original", "/explore");
  if (path.startsWith("/explore/play/")) return resolveExploreMapSeo(path);
  if (path.startsWith("/explore/")) {
    const collection = decodeURIComponent(path.split("/")[2] ?? "").toLowerCase();
    return resolveCollectionSeo(collection, path);
  }
  return notFoundSeoDescriptor(path);
}

async function resolveAdventureChapterSeo(path: string): Promise<SeoDescriptor> {
  const chapterId = decodeURIComponent(path.split("/").pop() ?? "");
  try {
    const adventure = await fetchJson<{
      chapters: Array<{ id: string; name: string; description: string }>;
    }>(siteUrl("assets/adventure/index.json"));
    const chapter = adventure.chapters.find((entry) => entry.id === chapterId);
    return adventureChapterSeoDescriptor(path, chapter);
  } catch {
    return adventureChapterSeoDescriptor(path);
  }
}

function resolveCollectionSeo(
  collectionId: string,
  canonicalPath: string,
): SeoDescriptor {
  return collectionSeoDescriptor(canonicalPath, { id: collectionId });
}

async function resolveExploreMapSeo(path: string): Promise<SeoDescriptor> {
  const parts = path.split("/").filter(Boolean);
  const collection = decodeURIComponent(parts[2] ?? "").toLowerCase();
  const id = decodeURIComponent(parts[3] ?? "").toLowerCase();
  if (collection === "imported")
    return exploreMapSeoDescriptor(path, { id, imported: true });
  try {
    const document = await fetchJson<{
      meta: { name: string; author?: string };
    }>(siteUrl(mapAssetUrl(collection, id)));
    return exploreMapSeoDescriptor(path, {
      id,
      name: document.meta.name,
      ...(document.meta.author ? { author: document.meta.author } : {}),
    });
  } catch {
    return exploreMapSeoDescriptor(path, { id });
  }
}

function applySeo(value: SeoDescriptor): void {
  const localized = localizedSeoDescriptor(value, getWebLocale());
  const canonical = `${SITE_ORIGIN}${localized.canonicalPath === "/" ? "/" : localized.canonicalPath}`;
  document.title = localized.title;
  setMeta("name", "description", localized.description);
  setMeta("name", "robots", localized.index ? "index,follow" : "noindex,follow");
  setLink("canonical", canonical);
  setMeta("property", "og:site_name", "Bobby Carrot 5 Remake");
  setMeta("property", "og:type", "website");
  setMeta("property", "og:title", localized.title);
  setMeta("property", "og:description", localized.description);
  setMeta("property", "og:url", canonical);
  setMeta("property", "og:image", OG_IMAGE);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", localized.title);
  setMeta("name", "twitter:description", localized.description);
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
