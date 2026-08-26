import {
  isAdventureLevelCompleted,
  isAdventureLevelUnlocked,
  parseAdventureLevelId,
  type AdventureLevelId,
  type AdventureSave,
} from "@bobby/adventure";
import { createApp, type Component } from "vue";
import type {
  AdventureIndex,
  AdventureIndexChapter,
  AdventureIndexLevel,
} from "../../services/catalog/catalog.js";
import {
  NOOP_CONTROLLER,
  type PageContext,
  type PageController,
} from "../../app/pageContracts.js";
import { loadAdventureSave } from "../../storage/adventureSaveStorage.js";
import { chapterStars } from "../../services/catalog/catalogPresentation.js";
import { configureShell } from "../../shell/shellBridge.js";
import { globalActions, pageIdentity } from "../../app/pageChrome.js";
import AdventureChapterPage from "./AdventureChapterPage.vue";
import AdventureChaptersPage from "./AdventureChaptersPage.vue";
import AdventureHomePage from "./AdventureHomePage.vue";
import type {
  AdventureChapterRow,
  AdventureLevelRow,
} from "./types.js";

export function renderAdventureHome(context: PageContext): PageController {
  const { app, adventure, audio, navigate } = context;
  const save = loadAdventureSave();
  const next = nextAdventureLevel(adventure, save);
  audio.playMusic("title");
  return mountAdventure(app, AdventureHomePage, {
    view: {
      nextLevelId: next?.id ?? null,
      bonusCoins: save.economy.bonusCoins,
      goldenCarrots: save.economy.goldenCarrots,
      goldenKey: save.upgrades.goldenKey,
    },
    onNavigate: navigate,
  });
}

export function renderAdventureChapters(context: PageContext): PageController {
  const { app, adventure, audio, navigate } = context;
  const save = loadAdventureSave();
  audio.playMusic("title");
  const rows: AdventureChapterRow[] = adventure.chapters.map((chapter) => {
    const number = Number(chapter.id);
    const done = chapter.levels.filter((level) =>
      isAdventureLevelCompleted(save, level.id),
    ).length;
    return {
      number,
      title: chapter.name,
      stars: chapterStars(chapter.difficulty),
      progress: `${done}/${chapter.levels.length}`,
      unlocked: save.campaign.unlockedChapters.includes(number),
    };
  });
  return mountAdventure(app, AdventureChaptersPage, {
    rows,
    onNavigate: navigate,
  });
}

export function renderAdventureChapter(
  context: PageContext,
  chapterNumber: number,
): PageController {
  const { app, adventure, audio, navigate } = context;
  const save = loadAdventureSave();
  const chapter = adventure.chapters.find(
    (item) => Number(item.id) === chapterNumber,
  );
  audio.playMusic("title");
  if (!chapter || !save.campaign.unlockedChapters.includes(chapterNumber)) {
    navigate("/adventure/chapters");
    return NOOP_CONTROLLER;
  }
  const rows: AdventureLevelRow[] = chapter.levels.map((level) => {
    const parsed = parseAdventureLevelId(level.id);
    const bonus = parsed?.kind === "bonus";
    return {
      id: level.id,
      label: bonus
        ? `BONUS ${parsed?.bonus ?? ""}`
        : `LEVEL ${parsed?.mainLevel ?? level.id}`,
      completed: isAdventureLevelCompleted(save, level.id),
      unlocked: isAdventureLevelUnlocked(save, level.id),
      bonus,
    };
  });
  return mountAdventure(app, AdventureChapterPage, {
    chapterNumber,
    title: chapter.name,
    description: chapter.description,
    stars: chapterStars(chapter.difficulty),
    rows,
    onNavigate: navigate,
  });
}

export function findAdventureLevel(
  adventure: AdventureIndex,
  id: string,
): { chapter: AdventureIndexChapter; level: AdventureIndexLevel } | undefined {
  const parsed = parseAdventureLevelId(id);
  if (!parsed) return undefined;
  for (const chapter of adventure.chapters) {
    const level = chapter.levels.find((item) => item.id === parsed.id);
    if (level) return { chapter, level };
  }
  return undefined;
}

function nextAdventureLevel(
  adventure: AdventureIndex,
  save: AdventureSave,
): AdventureIndexLevel | undefined {
  const done = new Set<AdventureLevelId>(save.campaign.completedLevels);
  const unlocked = new Set(save.campaign.unlockedChapters);
  for (const chapter of adventure.chapters) {
    if (!unlocked.has(Number(chapter.id))) continue;
    for (const level of chapter.levels) {
      const parsed = parseAdventureLevelId(level.id);
      if (parsed && !done.has(parsed.id)) return level;
    }
  }
  return undefined;
}

function mountAdventure(
  root: HTMLDivElement,
  component: Component,
  props: Record<string, unknown>,
): PageController {
  configureShell({
    topBar: {
      visible: true,
      fixed: true,
      identity: pageIdentity("冒险模式", "/adventure"),
      actions: globalActions(),
    },
    bottomBar: {
      visible: true,
      fixed: true,
      info: [{ text: "原版 Campaign · 章节进度与永久奖励" }],
    },
  });
  root.replaceChildren();
  const app = createApp(component, props);
  app.mount(root);
  return {
    destroy(): void {
      app.unmount();
    },
  };
}
