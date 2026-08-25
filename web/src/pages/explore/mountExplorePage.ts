import { createApp, nextTick } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import type { CatalogLevel } from "../../services/catalog/catalog.js";
import {
  randomCatalogLevel,
  resolveCatalogLevel,
} from "../../services/catalog/catalogSelection.js";
import {
  completedExploreLevels,
  lastExploreLevelId,
} from "../../storage/exploreProgressStorage.js";
import { renderAppShell } from "../../shell/shellBridge.js";
import ExplorePage from "./ExplorePage.vue";
import {
  hasActiveLevelFilters,
  mountLevelFilters,
  randomFilteredLevel,
} from "./levelFilters.js";

export async function renderLevels(
  context: PageContext,
): Promise<PageController> {
  const { app, catalog, audio, navigate } = context;
  const last = resolveCatalogLevel(catalog, lastExploreLevelId());
  const completed = completedExploreLevels();
  audio.playMusic("title");
  app.innerHTML = renderAppShell({
    mode: "explore",
    contextInfo: "全部关卡开放 · ✓ 表示曾通关",
    showScreenControlToggle: false,
    topBarFixed: true,
    bottomBarFixed: true,
    content: "",
  });
  const levelsByChapter = new Map(
    catalog.chapters.map((chapter) => [
      chapter.number,
      chapter.levelPublicIds
        .map((publicId) =>
          catalog.levels.find((level) => level.publicId === publicId),
        )
        .filter((level): level is CatalogLevel => Boolean(level)),
    ]),
  );
  const exploreApp = createApp(ExplorePage, {
    chapters: catalog.chapters,
    levelsByChapter,
    completedIds: completed,
    levelCount: catalog.levels.length,
    lastLevelId: last.publicId,
    onNavigate: navigate,
    onRandom: () => {
      const chosen = hasActiveLevelFilters()
        ? randomFilteredLevel()
        : randomCatalogLevel(catalog);
      if (chosen) navigate(`/play/${chosen.publicId}`);
    },
  });
  exploreApp.mount(app);
  await nextTick();
  await mountLevelFilters(catalog);
  return {
    destroy(): void {
      exploreApp.unmount();
    },
  };
}
