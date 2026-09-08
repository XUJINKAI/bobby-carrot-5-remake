import type { Locale } from "@bobby/i18n";
import {
  EDITOR_PALETTE_SIZES,
  SETTING_STORAGE_KEY,
  type EditorPaletteSize,
  type MusicMode,
  type WebSettings,
  type WebTheme,
} from "./contracts.js";

type SettingsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface WebSettingsDefaults {
  locale: Locale;
  screenControlEnabled: boolean;
}

let activeSettings: WebSettings | null = null;
let activeStorage: SettingsStorage | null = null;

/** 浏览器环境相关的默认值由入口提供，持久化层只负责形成完整合同。 */
export function createDefaultWebSettings(
  defaults: WebSettingsDefaults,
): WebSettings {
  return {
    schemaVersion: 1,
    locale: defaults.locale,
    theme: "bobby",
    audio: {
      musicEnabled: true,
      musicMode: "follow-theme",
      volume: 100,
    },
    controls: {
      screenControlEnabled: defaults.screenControlEnabled,
    },
    editor: {
      paletteSize: 48,
    },
  };
}

export function parseWebSettings(value: unknown): WebSettings {
  const root = requireRecord(value, "设置");
  requireKeys(
    root,
    ["schemaVersion", "locale", "theme", "audio", "controls", "editor"],
    "设置",
  );
  if (root.schemaVersion !== 1) throw new Error("设置 schemaVersion 必须为 1");

  const audio = requireRecord(root.audio, "设置 audio");
  const controls = requireRecord(root.controls, "设置 controls");
  const editor = requireRecord(root.editor, "设置 editor");
  requireKeys(audio, ["musicEnabled", "musicMode", "volume"], "设置 audio");
  requireKeys(controls, ["screenControlEnabled"], "设置 controls");
  requireKeys(editor, ["paletteSize"], "设置 editor");
  const locale = requireLocale(root.locale);
  const theme = requireTheme(root.theme);
  const musicEnabled = requireBoolean(audio.musicEnabled, "audio.musicEnabled");
  const musicMode = requireMusicMode(audio.musicMode);
  const volume = requireVolume(audio.volume);
  const screenControlEnabled = requireBoolean(
    controls.screenControlEnabled,
    "controls.screenControlEnabled",
  );
  const paletteSize = requirePaletteSize(editor.paletteSize);

  return {
    schemaVersion: 1,
    locale,
    theme,
    audio: { musicEnabled, musicMode, volume },
    controls: { screenControlEnabled },
    editor: { paletteSize },
  };
}

/** 非法 record 会被清理，并按当前浏览器环境恢复完整默认设置。 */
export function loadWebSettings(
  defaults: WebSettingsDefaults,
  storage: SettingsStorage = localStorage,
): WebSettings {
  const fallback = createDefaultWebSettings(defaults);
  const serialized = storage.getItem(SETTING_STORAGE_KEY);
  if (serialized === null) return fallback;

  try {
    return parseWebSettings(JSON.parse(serialized));
  } catch {
    storage.removeItem(SETTING_STORAGE_KEY);
    return fallback;
  }
}

export function storeWebSettings(
  settings: WebSettings,
  storage: SettingsStorage = localStorage,
): WebSettings {
  const parsed = parseWebSettings(settings);
  storage.setItem(SETTING_STORAGE_KEY, JSON.stringify(parsed));
  return cloneSettings(parsed);
}

/** App 入口只初始化一次；后续模块共享同一份内存状态和写入路径。 */
export function initializeWebSettings(
  defaults: WebSettingsDefaults,
  storage: SettingsStorage = localStorage,
): WebSettings {
  activeStorage = storage;
  activeSettings = loadWebSettings(defaults, storage);
  return cloneSettings(activeSettings);
}

export function getWebSettings(): WebSettings {
  if (!activeSettings) throw new Error("Web Settings 尚未初始化");
  return cloneSettings(activeSettings);
}

export function updateWebSettings(
  update: (current: WebSettings) => WebSettings,
): WebSettings {
  if (!activeStorage) throw new Error("Web Settings 尚未初始化");
  const next = storeWebSettings(update(getWebSettings()), activeStorage);
  activeSettings = next;
  return cloneSettings(next);
}

function cloneSettings(settings: WebSettings): WebSettings {
  return {
    ...settings,
    audio: { ...settings.audio },
    controls: { ...settings.controls },
    editor: { ...settings.editor },
  };
}

function requireRecord(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${name}必须是对象`);
  return value as Record<string, unknown>;
}

function requireKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  name: string,
): void {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length ||
    actual.some((key, index) => key !== required[index])
  )
    throw new Error(`${name}字段必须为 ${expected.join(" / ")}`);
}

function requireLocale(value: unknown): Locale {
  if (value === "zh-CN" || value === "en") return value;
  throw new Error("设置 locale 无效");
}

function requireTheme(value: unknown): WebTheme {
  if (value === "bobby" || value === "fc") return value;
  throw new Error("设置 theme 无效");
}

function requireMusicMode(value: unknown): MusicMode {
  if (value === "follow-theme" || value === "modern" || value === "8bit")
    return value;
  throw new Error("设置 audio.musicMode 无效");
}

function requireBoolean(value: unknown, name: string): boolean {
  if (typeof value === "boolean") return value;
  throw new Error(`设置 ${name} 必须为 boolean`);
}

function requireVolume(value: unknown): number {
  if (Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 200)
    return Number(value);
  throw new Error("设置 audio.volume 必须是 0～200 的整数");
}

function requirePaletteSize(value: unknown): EditorPaletteSize {
  if (EDITOR_PALETTE_SIZES.includes(value as EditorPaletteSize))
    return value as EditorPaletteSize;
  throw new Error("设置 editor.paletteSize 无效");
}
