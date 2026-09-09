import { createApp, nextTick } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import type { MapCollectionMap } from "../../services/catalog/catalog.js";
import {
  completedExploreMapIds,
  lastExploreMapId,
} from "../../storage/exploreProgressStorage.js";
import { configureShell } from "../../shell/shellBridge.js";
import ExplorePage from "./ExplorePage.vue";
import { explorePlayPath } from "../../app/routes.js";
import {
  hasActiveLevelFilters,
  mountLevelFilters,
  randomFilteredMap,
} from "./levelFilters.js";
import {
  globalActions,
  pageIdentity,
} from "../../app/pageChrome.js";

export async function renderLevels(
  context: PageContext,
  collectionId = "original",
): Promise<PageController> {
  const { app, collections, collectionsIndex, audio, images, navigate } = context;
  const collection = collections.find((entry) => entry.id === collectionId);
  if (!collection || collection.maps.length === 0) {
    navigate("/explore");
    return { destroy() {} };
  }
  const lastId = lastExploreMapId(collection.id) ?? collection.maps[0]!.id;
  const lastMap = collection.maps.find((entry) => entry.id === lastId)
    ?? collection.maps[0]!;
  const completed = completedExploreMapIds(collection.id);
  const mapsByChapter = new Map<string, MapCollectionMap[]>();
  for (const chapter of collection.chapters)
    mapsByChapter.set(
      chapter.id,
      collection.maps.filter((map) => map.chapter === chapter.id),
    );

  audio.playMusic("title");
  configureShell({
    topBar: {
      visible: true,
      fixed: true,
      identity: pageIdentity("自由探索模式", "/explore"),
      actions: globalActions(),
    },
    bottomBar: { visible: false },
  });
  app.replaceChildren();
  const exploreApp = createApp(ExplorePage, {
    activeCollection: collection,
    collections: collectionsIndex.collections,
    mapsByChapter,
    completedIds: completed,
    lastMapId: lastMap.id,
    lastMapLabel: lastMap.name,
    onNavigate: navigate,
    onRandom: () => {
      const chosen = hasActiveLevelFilters()
        ? randomFilteredMap()
        : collection.maps[Math.floor(Math.random() * collection.maps.length)];
      if (chosen)
        navigate(
          explorePlayPath({ collection: collection.id, id: chosen.id }),
        );
    },
  });
  exploreApp.mount(app);
  await nextTick();
  if (collection.filters.length > 0) mountLevelFilters(collection, images);
  return {
    destroy(): void {
      exploreApp.unmount();
    },
  };
}
