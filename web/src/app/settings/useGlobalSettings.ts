import type { AudioRuntime } from "@bobby/engine";
import type { Locale } from "@bobby/i18n";
import { reactive } from "vue";
import {
  loadScreenControlPreference,
  storeScreenControlPreference,
} from "../../shell/shellBridge.js";
import { getWebLocale, setWebLocale } from "../../i18n/webI18n.js";
import {
  getWebTheme,
  setWebTheme,
  type WebTheme,
} from "../../theme/webTheme.js";
import {
  resolveMusicMode,
  resolveMusicStyle,
  resolveVolume,
  type MusicMode,
} from "./globalPreferences.js";

const MUSIC_ENABLED_KEY = "bobby.musicEnabled";
const MUSIC_MODE_KEY = "bobby.musicMode";
const VOLUME_KEY = "bobby.volume";

export interface GlobalSettingsState {
  locale: Locale;
  theme: WebTheme;
  musicEnabled: boolean;
  musicMode: MusicMode;
  volume: number;
  screenControlEnabled: boolean;
}

export function useGlobalSettings(audio: AudioRuntime) {
  applyStoredAudioSettings(audio);
  const state = reactive<GlobalSettingsState>(readState(audio));

  const refresh = (): void => {
    Object.assign(state, readState(audio));
  };
  const setLocale = (locale: Locale): void => {
    setWebLocale(locale);
    state.locale = locale;
  };
  const setTheme = (theme: WebTheme): void => {
    setWebTheme(theme);
    state.theme = theme;
    applyResolvedMusicStyle(audio, theme, state.musicMode);
  };
  const toggleMusic = (): void => {
    setMusicEnabled(!audio.isMusicEnabled());
  };
  const setMusicEnabled = (enabled: boolean): void => {
    audio.setMusicEnabled(enabled);
    localStorage.setItem(MUSIC_ENABLED_KEY, String(enabled));
    state.musicEnabled = enabled;
  };
  const setMusicMode = (mode: MusicMode): void => {
    localStorage.setItem(MUSIC_MODE_KEY, mode);
    state.musicMode = mode;
    applyResolvedMusicStyle(audio, state.theme, mode);
  };
  const setVolume = (value: number): void => {
    const volume = clampVolume(value);
    const gain = volume / 100;
    audio.setMusicGain(gain);
    audio.setSoundGain(gain);
    localStorage.setItem(VOLUME_KEY, String(volume));
    state.volume = volume;
  };
  const setScreenControl = (enabled: boolean): void => {
    state.screenControlEnabled = enabled;
    storeScreenControlPreference(enabled);
  };

  return {
    state,
    refresh,
    setLocale,
    setTheme,
    toggleMusic,
    setMusicEnabled,
    setMusicMode,
    setVolume,
    setScreenControl,
  };
}

function applyStoredAudioSettings(audio: AudioRuntime): void {
  const theme = getWebTheme();
  const musicMode = resolveMusicMode(localStorage.getItem(MUSIC_MODE_KEY));
  const volume = resolveVolume(localStorage.getItem(VOLUME_KEY));
  const gain = volume / 100;
  audio.setMusicEnabled(localStorage.getItem(MUSIC_ENABLED_KEY) !== "false");
  audio.setMusicGain(gain);
  audio.setSoundGain(gain);
  applyResolvedMusicStyle(audio, theme, musicMode);
}

function readState(audio: AudioRuntime): GlobalSettingsState {
  return {
    locale: getWebLocale(),
    theme: getWebTheme(),
    musicEnabled: audio.isMusicEnabled(),
    musicMode: resolveMusicMode(localStorage.getItem(MUSIC_MODE_KEY)),
    volume: Math.round(audio.getMusicGain() * 100),
    screenControlEnabled: loadScreenControlPreference(),
  };
}

function applyResolvedMusicStyle(
  audio: AudioRuntime,
  theme: WebTheme,
  mode: MusicMode,
): void {
  audio.setMusicStyle(resolveMusicStyle(theme, mode));
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(200, Math.max(0, Math.round(value)));
}
