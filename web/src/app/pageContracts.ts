import type { AudioRuntime, ImageManager } from "@bobby/engine";
import type {
  AdventureIndex,
  MapCollectionIndex,
  MapCollectionsIndex,
} from "../services/catalog/catalog.js";

export type Navigate = (path: string) => void;

export interface PageController {
  destroy(): void;
}

export const NOOP_CONTROLLER: PageController = {
  destroy() {},
};

/** Runtime wrapper: serialized MapCollectionIndex identity still comes from its resource path. */
export type ResolvedMapCollection = MapCollectionIndex & { id: string };

export interface PageContext {
  app: HTMLDivElement;
  collectionsIndex: MapCollectionsIndex;
  collections: ResolvedMapCollection[];
  adventure: AdventureIndex;
  audio: AudioRuntime;
  images: ImageManager;
  navigate: Navigate;
}
