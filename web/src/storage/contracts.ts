import type { AdventureSave } from "@bobby/adventure";
import type { Locale } from "@bobby/i18n";
import type { Bc5rGameId, MapDocument } from "@bobby/model";

/** 浏览器物理存储命名空间；这些字符串属于 Web 持久化合同。 */
export const SETTING_STORAGE_KEY = "bc5r:setting";
export const ADVENTURE_STORAGE_KEY = "bc5r:adventure";
export const EXPLORE_STORAGE_PREFIX = "bc5r:explore/";
export const EDITOR_STORAGE_PREFIX = "bc5r:editor/";
export const EDITOR_AUTOSAVE_SLOT = "autosave";
export const EDITOR_AUTOSAVE_STORAGE_KEY = `${EDITOR_STORAGE_PREFIX}${EDITOR_AUTOSAVE_SLOT}`;

export type WebTheme = "bobby" | "fc";
export type MusicMode = "follow-theme" | "modern" | "8bit";
export const EDITOR_PALETTE_SIZES = [32, 40, 48, 56, 64] as const;
export type EditorPaletteSize = (typeof EDITOR_PALETTE_SIZES)[number];

/** Web 用户偏好的唯一持久化合同，对应一条 bc5r:setting record。 */
export interface WebSettings {
  schemaVersion: 1;
  locale: Locale;
  theme: WebTheme;
  audio: {
    musicEnabled: boolean;
    musicMode: MusicMode;
    volume: number;
  };
  controls: {
    screenControlEnabled: boolean;
  };
  editor: {
    paletteSize: EditorPaletteSize;
  };
}

/** 每个 Explore collection 对应一条物理 localStorage record。 */
export interface ExploreCollectionStorage {
  schemaVersion: 1;
  /** 每份独立 collection save 都携带的项目来源标识。 */
  game: Bc5rGameId;
  completedMaps: string[];
  lastMap?: string;
}

/** 仅用于携带和导出的视图；物理存储仍为每个 collection 一个 key。 */
export type ExploreStorageSnapshot = Record<string, ExploreCollectionStorage>;

/**
 * Editor 持久化的携带与导出视图。
 * 物理存储包含 bc5r:editor/autosave，以及每份命名存档各自的 bc5r:editor/<name> key。
 */
export interface EditorStorageSnapshot {
  autosave?: MapDocument;
  saves: Record<string, MapDocument>;
}

/** 跨 Web 持久化领域的完整便携备份；自身不是 localStorage record。 */
export interface WebStorageSnapshot {
  schemaVersion: 1;
  setting: WebSettings;
  adventure: AdventureSave;
  explore: ExploreStorageSnapshot;
  editor: EditorStorageSnapshot;
}

export function exploreStorageKey(collectionId: string): string {
  const id = collectionId.trim();
  if (!id) throw new Error("Explore collection ID cannot be empty");
  return `${EXPLORE_STORAGE_PREFIX}${id}`;
}

/**
 * Editor 命名存档 key。slot name 使用 URI 编码，可安全容纳空格和 CJK 字符。
 * "autosave" 保留给工作草稿，不能作为命名存档名。
 */
export function editorStorageKey(name: string): string {
  const normalized = name.trim();
  if (!normalized) throw new Error("Editor save name cannot be empty");
  if (normalized === EDITOR_AUTOSAVE_SLOT)
    throw new Error(`Editor save name ${JSON.stringify(normalized)} is reserved`);
  return `${EDITOR_STORAGE_PREFIX}${encodeURIComponent(normalized)}`;
}
