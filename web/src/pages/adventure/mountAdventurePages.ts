import {
  hasAdventureItem,
  isAdventureChapterCompleted,
  isAdventureLevelCompleted,
  isAdventureLevelUnlocked,
  parseAdventureLevelId,
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
import { configureShell, type ShellConfig } from "../../shell/shellBridge.js";
import { globalActions, pageIdentity } from "../../app/pageChrome.js";
import AdventureChapterPage from "./AdventureChapterPage.vue";
import AdventureChaptersPage from "./AdventureChaptersPage.vue";
import AdventureHomePage from "./AdventureHomePage.vue";
import AdventureNightTrainPage from "./AdventureNightTrainPage.vue";
import type {
  AdventureChapterRow,
  AdventureLevelRow,
  AdventureNightTrainDestination,
} from "./types.js";

export function renderAdventureHome(context: PageContext): PageController {
  const { app, adventure, audio, images, navigate } = context;
  const save = loadAdventureSave();
  const resume = findAdventureLevel(adventure, save.campaign.resumeLevelId);
  audio.playMusic("title");
  return mountAdventure(
    app,
    AdventureHomePage,
    {
      view: {
        resumeLevelId: resume?.level.id ?? "1-1",
        resumeChapterTitle: resume?.chapter.name ?? "FAIRY MAGIC",
        bonusCoins: save.economy.bonusCoins,
        goldenCarrots: save.economy.goldenCarrots,
      },
      images,
      onNavigate: navigate,
    },
    adventureShell(),
  );
}

export function renderAdventureChapters(context: PageContext): PageController {
  const { app, adventure, audio, images, navigate } = context;
  const save = loadAdventureSave();
  audio.playMusic("title");
  const rows: AdventureChapterRow[] = adventure.chapters.map((chapter) => {
    const number = Number(chapter.id);
    return {
      number,
      title: chapter.name,
      difficulty: chapter.difficulty,
      completed: isAdventureChapterCompleted(save, number),
    };
  });
  return mountAdventure(
    app,
    AdventureChaptersPage,
    { rows, images, onNavigate: navigate },
    adventureShell("章节选择", "/adventure"),
  );
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
  if (!chapter) {
    navigate("/adventure/chapters");
    return NOOP_CONTROLLER;
  }
  const rows: AdventureLevelRow[] = chapter.levels.map((level) => ({
    id: level.id,
    completed: isAdventureLevelCompleted(save, level.id),
    unlocked: isAdventureLevelUnlocked(save, level.id),
  }));
  return mountAdventure(
    app,
    AdventureChapterPage,
    {
      chapterNumber,
      title: chapter.name,
      description: chapter.description,
      difficulty: chapter.difficulty,
      rows,
      onNavigate: navigate,
    },
    adventureShell(
      `${String(chapterNumber).padStart(2, "0")} · ${chapter.name}`,
      "/adventure/chapters",
    ),
  );
}

export function renderAdventureNightTrain(context: PageContext): PageController {
  const { app, audio, images, navigate } = context;
  const save = loadAdventureSave();
  const destinations: AdventureNightTrainDestination[] = [
    {
      id: "dream-machine",
      label: "DREAM MACHINE",
      href: "/adventure/night-train/dream-machine",
    },
    {
      id: "cloud-9",
      label: "CLOUD 9",
      href: "/adventure/night-train/cloud-9",
    },
    ...(hasAdventureItem(save, "night-train-map-1")
      ? [{ id: "map-1", label: "MAP I", note: "AUTHOR EXTRA" }]
      : []),
    ...(hasAdventureItem(save, "night-train-map-2")
      ? [{ id: "map-2", label: "MAP II", note: "AUTHOR EXTRA" }]
      : []),
  ];
  audio.playMusic("title");
  return mountAdventure(
    app,
    AdventureNightTrainPage,
    { images, destinations, onNavigate: navigate },
    adventureShell("夜间列车", "/adventure"),
  );
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

function mountAdventure(
  root: HTMLDivElement,
  component: Component,
  props: Record<string, unknown>,
  shell: ShellConfig,
): PageController {
  configureShell(shell);
  root.replaceChildren();
  const app = createApp(component, props);
  app.mount(root);
  return {
    destroy(): void {
      app.unmount();
    },
  };
}

function adventureShell(backLabel?: string, backPath?: string): ShellConfig {
  return {
    topBar: {
      visible: true,
      fixed: true,
      identity: pageIdentity("冒险模式", "/adventure"),
      ...(backPath && backLabel
        ? {
            back: {
              id: "back",
              icon: "back",
              label: backLabel,
              title: "返回",
              href: backPath,
            },
          }
        : {}),
      actions: globalActions(),
    },
    bottomBar: {
      visible: false,
      fixed: true,
    },
  };
}
