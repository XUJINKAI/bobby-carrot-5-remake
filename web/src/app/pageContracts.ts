import type { TinySynthAudioBackend } from "../services/audio/TinySynthAudio.js";
import type { LevelCatalog } from "../services/catalog/catalog.js";

export type Navigate = (path: string) => void;

export interface PageController {
  destroy(): void;
}

export const NOOP_CONTROLLER: PageController = {
  destroy() {},
};

export interface PageContext {
  app: HTMLDivElement;
  catalog: LevelCatalog;
  audio: TinySynthAudioBackend;
  navigate: Navigate;
}
