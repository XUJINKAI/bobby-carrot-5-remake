import type { MapCollectionIndex } from "../../services/catalog/catalog.js";

export interface VisibleCollectionCounts {
  chapters: number;
  maps: number;
  campaignMaps: number;
  specialScenes: number;
}

export function exploreCollectionSummary(
  collection: MapCollectionIndex,
  visible?: VisibleCollectionCounts,
): string {
  const specialScenes = collection.maps.filter(
    (map) => map.kind === "special-scene",
  ).length;
  const chapters = collection.chapters.filter(
    (chapter) => chapter.kind !== "special-scenes",
  ).length;
  const campaignMaps = collection.maps.length - specialScenes;

  if (specialScenes > 0) {
    return visible
      ? `${visible.chapters} / ${chapters} 章 · ${visible.campaignMaps} / ${campaignMaps} 关 · ${visible.specialScenes} / ${specialScenes} 个 Special Scene`
      : `${chapters} 章 · ${campaignMaps} 关 · ${specialScenes} 个 Special Scene`;
  }
  if (chapters > 0) {
    return visible
      ? `${visible.chapters} / ${chapters} 章 · ${visible.maps} / ${collection.maps.length} 关`
      : `${chapters} 章 · ${collection.maps.length} 关`;
  }
  return visible
    ? `${visible.maps} / ${collection.maps.length} 张地图`
    : `${collection.maps.length} 张地图`;
}
