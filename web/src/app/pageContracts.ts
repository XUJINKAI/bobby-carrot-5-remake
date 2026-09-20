import type { AudioRuntime, ImageManager } from "@bobby/engine";
import type {
  AdventureIndex,
  MapCollectionsIndex,
} from "../services/catalog/catalog.js";
import type { ResolvedMapCollection } from "../services/catalog/catalogRuntime.js";

export interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
}

export type Navigate = (path: string, options?: NavigateOptions) => void;

export interface PageController {
  destroy(): void;
  localeChanged?(): void;
}

export const NOOP_CONTROLLER: PageController = {
  destroy() {},
};

export type { ResolvedMapCollection };

export interface PageContext {
  app: HTMLDivElement;
  collectionsIndex: MapCollectionsIndex;
  loadCollectionsIndex(): Promise<MapCollectionsIndex>;
  collections: ResolvedMapCollection[];
  adventure: AdventureIndex;
  audio: AudioRuntime;
  images: ImageManager;
  navigate: Navigate;
}
