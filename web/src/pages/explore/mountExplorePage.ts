import { createApp, nextTick } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import type { CatalogLevel } from "../../services/catalog/catalog.js";
import {
  randomCatalogLevel,
  resolveCatalogLevel,
} from "../../services/catalog/catalogSelection.js";
import {
  completedExploreLevels,
  lastExploreMapId,
  lastExploreLevelId,
} from "../../storage/exploreProgressStorage.js";
import { renderAppShell } from "../../shell/shellBridge.js";
import ExplorePage from "./ExplorePage.vue";
import { explorePlayPath } from "../../app/routes.js";
import {
  hasActiveLevelFilters,
  mountLevelFilters,
  randomFilteredLevel,
} from "./levelFilters.js";

export async function renderLevels(
  context: PageContext,
  collectionId = "original",
): Promise<PageController> {
  const { app, catalog, customMapCatalog, audio, navigate } = context;
  const customCollection = customMapCatalog.collections.find(
    (entry) => entry.id === collectionId,
  );
  if (collectionId !== "original" && !customCollection) {
    navigate("/explore");
    return { destroy() {} };
  }
  const last = resolveCatalogLevel(catalog, lastExploreLevelId());
  const customLastId = customCollection
    ? lastExploreMapId(collectionId) ?? customCollection.maps[0]!.id
    : null;
  const customLast = customCollection?.maps.find(
    (entry) => entry.id === customLastId,
  ) ?? customCollection?.maps[0];
  const completed = completedExploreLevels();
  audio.playMusic("title");
  app.innerHTML = renderAppShell({
    mode: "explore",
    contextInfo:
      collectionId === "original"
        ? "全部关卡开放 · ✓ 表示曾通关"
        : `${customCollection!.name} · ${customCollection!.maps.length} 张地图`,
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
    lastMapId: customLast?.id ?? last.publicId,
    lastMapLabel: customLast?.name ?? last.publicId.toUpperCase(),
    activeCollection: collectionId,
    customCollections: customMapCatalog.collections,
    customCollection,
    onNavigate: navigate,
    onRandom: () => {
      if (customCollection) {
        const chosen = customCollection.maps[
          Math.floor(Math.random() * customCollection.maps.length)
        ];
        if (chosen)
          navigate(explorePlayPath({ collection: collectionId, id: chosen.id }));
        return;
      }
      const chosen = hasActiveLevelFilters()
        ? randomFilteredLevel()
        : randomCatalogLevel(catalog);
      if (chosen)
        navigate(explorePlayPath({ collection: "original", id: chosen.publicId }));
    },
  });
  exploreApp.mount(app);
  await nextTick();
  if (collectionId === "original") await mountLevelFilters(catalog);
  return {
    destroy(): void {
      exploreApp.unmount();
    },
  };
}
