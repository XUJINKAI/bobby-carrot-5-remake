import { SEO_CATALOGS } from "@bobby/i18n";

const STATIC_ROUTES = {
  "/": ["seo.home.title", "seo.home.description", true],
  "/adventure": ["seo.adventure.title", "seo.adventure.description", true],
  "/adventure/chapters": [
    "seo.adventureChapters.title",
    "seo.adventureChapters.description",
    true,
  ],
  "/adventure/night-train": [
    "seo.nightTrain.title",
    "seo.nightTrain.description",
    true,
  ],
  "/edit": ["seo.editor.title", "seo.editor.description", true],
  "/edit/test": ["seo.editor.title", "seo.editor.description", false],
  "/embed": ["seo.embed.title", "seo.embed.description", true],
  "/settings": ["seo.settings.title", "seo.settings.description", false],
  "/import/v1": ["seo.import.title", "seo.import.description", false],
};

export const ADVENTURE_SPECIAL_SCENES = {
  "beaver-shop": {
    path: "/adventure/beaver-shop",
    name: "Beaver Shop",
  },
  "dream-machine": {
    path: "/adventure/night-train/dream-machine",
    name: "Dream Machine",
  },
  "cloud-9": {
    path: "/adventure/night-train/cloud-9",
    name: "Cloud 9",
  },
  "dreamland-reward": {
    path: "/adventure/night-train/dreamland-reward",
    name: "Dreamland Reward",
  },
};

export function staticSeoDescriptor(path) {
  const route = STATIC_ROUTES[path];
  if (!route) return null;
  const [titleKey, descriptionKey, index] = route;
  return descriptor(
    path,
    index,
    translated(titleKey),
    translated(descriptionKey),
  );
}

export function adventureSceneSeoDescriptor(path, name) {
  const params = { name };
  return descriptor(
    path,
    false,
    translated("seo.scene.title", params),
    translated("seo.scene.description", params),
  );
}

export function adventureLevelSeoDescriptor(path, id) {
  const normalizedId = id.toUpperCase();
  const params = { id: normalizedId };
  return descriptor(
    path,
    false,
    translated("seo.adventureLevel.title", params),
    translated("seo.adventureLevel.description", params),
  );
}

export function adventureChapterSeoDescriptor(path, chapter) {
  if (!chapter) {
    return descriptor(
      path,
      true,
      translated("seo.chapter.fallbackTitle"),
      translated("seo.chapter.fallbackDescription"),
    );
  }
  const chapterNumber = String(Number(chapter.id)).padStart(2, "0");
  const params = {
    chapter: chapterNumber,
    name: chapter.name,
  };
  return descriptor(
    path,
    true,
    translated("seo.chapter.title", params),
    chapter.description
      ? sameText(chapter.description)
      : translated("seo.chapter.description", { chapter: chapterNumber }),
  );
}

export function collectionSeoDescriptor(canonicalPath, collection) {
  if (!collection) {
    return descriptor(
      canonicalPath,
      true,
      translated("seo.collection.fallbackTitle"),
      translated("seo.collection.fallbackDescription"),
    );
  }
  const title = collection.id === "original"
    ? translated("seo.collection.originalTitle")
    : translated("seo.collection.customTitle", { name: collection.name });
  const description = collection.description
    ? sameText(collection.description)
    : translated("seo.collection.description", { name: collection.name });
  return descriptor(canonicalPath, true, title, description);
}

export function exploreMapSeoDescriptor(path, map) {
  if (map.imported) {
    return descriptor(
      path,
      false,
      translated("seo.importedMap.title"),
      translated("seo.importedMap.description"),
    );
  }
  const id = String(map.id).toUpperCase();
  if (!map.name) {
    return descriptor(
      path,
      true,
      translated("seo.map.fallbackTitle", { id }),
      translated("seo.map.fallbackDescription", { id }),
    );
  }
  const title = normalizeMapTitle(map.name, map.id);
  const extra = map.description ? String(map.description) : "";
  return descriptor(
    path,
    true,
    translated("seo.map.title", { title }),
    {
      "zh-CN": text("zh-CN", "seo.map.description", {
        name: map.name,
        author: map.author ? `，作者 ${map.author}` : "",
        extra,
      }),
      en: text("en", "seo.map.description", {
        name: map.name,
        author: map.author ? ` by ${map.author}` : "",
        extra: extra ? ` ${extra}` : "",
      }),
    },
  );
}

export function notFoundSeoDescriptor(path) {
  return descriptor(
    path,
    false,
    translated("seo.notFound.title"),
    translated("seo.notFound.description"),
  );
}

export function localizedSeoDescriptor(value, locale) {
  return {
    title: value.title[locale],
    description: value.description[locale],
    canonicalPath: value.canonicalPath,
    index: value.index,
  };
}

export function bilingualSeoDescriptor(value) {
  return {
    title: combineFallback(value.title["zh-CN"], value.title.en),
    description: combineFallback(
      value.description["zh-CN"],
      value.description.en,
    ),
    canonicalPath: value.canonicalPath,
    index: value.index,
  };
}

function descriptor(canonicalPath, index, title, description) {
  return { title, description, canonicalPath, index };
}

function translated(key, params = {}) {
  return {
    "zh-CN": text("zh-CN", key, params),
    en: text("en", key, params),
  };
}

function sameText(value) {
  return { "zh-CN": value, en: value };
}

function text(locale, key, params) {
  const template = SEO_CATALOGS[locale][key] ?? key;
  return template.replace(/\{([A-Za-z0-9_.-]+)\}/g, (match, param) => {
    const value = params?.[param];
    return value === undefined ? match : String(value);
  });
}

function combineFallback(zh, en) {
  if (zh === en || zh.includes(en)) return zh;
  if (en.includes(zh)) return en;
  return `${zh} / ${en}`;
}

function normalizeMapTitle(name, id) {
  const trimmed = String(name).trim();
  return trimmed.toLowerCase() === String(id).toLowerCase()
    ? trimmed
    : `${trimmed} · ${String(id).toUpperCase()}`;
}
