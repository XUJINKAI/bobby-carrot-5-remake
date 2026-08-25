import {
  campaignSequenceForChapter,
  isAdventureLevelCompleted,
  isAdventureLevelUnlocked,
  parseAdventureLevelId,
  type AdventureLevelId,
  type AdventureSave,
} from "@bobby/adventure";
import { createApp, type Component } from "vue";
import type { TinySynthAudioBackend } from "../../services/audio/TinySynthAudio.js";
import {
  NOOP_CONTROLLER,
  type Navigate,
  type PageController,
} from "../../app/pageContracts.js";
import { loadAdventureSave } from "../../storage/adventureSaveStorage.js";
import {
  chapterStars,
  displayLevelShort,
} from "../../services/catalog/catalogPresentation.js";
import type {
  CatalogLevel,
  LevelCatalog,
} from "../../services/catalog/catalog.js";
import { renderAppShell } from "../../shell/shellBridge.js";
import AdventureChapterPage from "./AdventureChapterPage.vue";
import AdventureChaptersPage from "./AdventureChaptersPage.vue";
import AdventureHomePage from "./AdventureHomePage.vue";
import type {
  AdventureChapterRow,
  AdventureLevelRow,
} from "./types.js";

export interface AdventurePageContext {
  app: HTMLDivElement;
  catalog: LevelCatalog;
  audio: TinySynthAudioBackend;
  navigate: Navigate;
}

export function renderAdventureHome(
  context: AdventurePageContext,
): PageController {
  const { app, catalog, audio, navigate } = context;
  const save = loadAdventureSave();
  const next = nextAdventureLevel(catalog, save);
  audio.playMusic("title");
  return mountAdventure(app, AdventureHomePage, {
    view: {
      nextLevelId: next?.publicId ?? null,
      bonusCoins: save.economy.bonusCoins,
      goldenCarrots: save.economy.goldenCarrots,
      goldenKey: save.upgrades.goldenKey,
    },
    onNavigate: navigate,
  });
}

export function renderAdventureChapters(
  context: AdventurePageContext,
): PageController {
  const { app, catalog, audio, navigate } = context;
  const save = loadAdventureSave();
  audio.playMusic("title");
  const rows: AdventureChapterRow[] = catalog.chapters.map((chapter) => {
    const levels = chapter.levelPublicIds
      .map((id) => catalog.levels.find((level) => level.publicId === id))
      .filter((value): value is CatalogLevel => Boolean(value));
    const done = levels.filter((level) =>
      isAdventureLevelCompleted(save, level.publicId),
    ).length;
    return {
      number: chapter.number,
      title: chapter.title,
      stars: chapterStars(chapter.difficultyStars),
      progress: `${done}/${levels.length}`,
      unlocked: save.campaign.unlockedChapters.includes(chapter.number),
    };
  });
  return mountAdventure(app, AdventureChaptersPage, {
    rows,
    onNavigate: navigate,
  });
}

export function renderAdventureChapter(
  context: AdventurePageContext,
  chapterNumber: number,
): PageController {
  const { app, catalog, audio, navigate } = context;
  const save = loadAdventureSave();
  const chapter = catalog.chapters.find(
    (item) => item.number === chapterNumber,
  );
  audio.playMusic("title");
  if (!chapter || !save.campaign.unlockedChapters.includes(chapterNumber)) {
    navigate("/adventure/chapters");
    return NOOP_CONTROLLER;
  }
  const byId = new Map(catalog.levels.map((level) => [level.publicId, level]));
  const rows = campaignSequenceForChapter(chapterNumber)
    .map((id): AdventureLevelRow | null => {
      const level = byId.get(id);
      if (!level) return null;
      return {
        id,
        label:
          level.contentKind === "bonus"
            ? `BONUS ${level.bonusOrdinal}`
            : `LEVEL ${displayLevelShort(level)}`,
        completed: isAdventureLevelCompleted(save, id),
        unlocked: isAdventureLevelUnlocked(save, id),
        bonus: level.contentKind === "bonus",
      };
    })
    .filter((row): row is AdventureLevelRow => row !== null);
  return mountAdventure(app, AdventureChapterPage, {
    chapterNumber,
    title: chapter.title,
    description: chapter.description,
    stars: chapterStars(chapter.difficultyStars),
    rows,
    onNavigate: navigate,
  });
}

export function findAdventureLevel(
  catalog: LevelCatalog,
  id: string,
): CatalogLevel | undefined {
  const parsed = parseAdventureLevelId(id);
  return parsed
    ? catalog.levels.find((level) => level.publicId === parsed.id)
    : undefined;
}

function nextAdventureLevel(
  catalog: LevelCatalog,
  save: AdventureSave,
): CatalogLevel | undefined {
  const done = new Set<AdventureLevelId>(save.campaign.completedLevels);
  const unlocked = new Set(save.campaign.unlockedChapters);
  for (const chapter of catalog.chapters) {
    if (!unlocked.has(chapter.number)) continue;
    for (const id of chapter.levelPublicIds) {
      const level = catalog.levels.find((item) => item.publicId === id);
      if (level && !done.has(id)) return level;
    }
  }
  return undefined;
}

function mountAdventure(
  root: HTMLDivElement,
  component: Component,
  props: Record<string, unknown>,
): PageController {
  root.innerHTML = renderAppShell({
    mode: "adventure",
    contextInfo: "原版 Campaign · 章节进度与永久奖励",
    showScreenControlToggle: false,
    topBarFixed: true,
    bottomBarFixed: true,
    content: "",
  });
  const app = createApp(component, props);
  app.mount(root);
  return {
    destroy(): void {
      app.unmount();
    },
  };
}
