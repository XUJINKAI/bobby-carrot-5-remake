import type { AudioRuntime } from "@bobby/engine";
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

export interface PageContext {
  app: HTMLDivElement;
  collectionsIndex: MapCollectionsIndex;
  collections: MapCollectionIndex[];
  adventure: AdventureIndex;
  audio: AudioRuntime;
  navigate: Navigate;
}
