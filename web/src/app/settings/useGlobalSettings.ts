import type { AudioRuntime } from "@bobby/engine";
import type { Locale } from "@bobby/i18n";
import { reactive } from "vue";
import { getWebLocale, setWebLocale } from "../../i18n/webI18n.js";
import {
  getWebSettings,
  updateWebSettings,
} from "../../storage/settingsStorage.js";
import {
  getWebTheme,
  setWebTheme,
  type WebTheme,
} from "../../theme/webTheme.js";
import { resolveMusicStyle, type MusicMode } from "./globalPreferences.js";

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
    updateWebSettings((settings) => ({ ...settings, locale }));
    setWebLocale(locale);
    state.locale = locale;
  };
  const setTheme = (theme: WebTheme): void => {
    updateWebSettings((settings) => ({ ...settings, theme }));
    setWebTheme(theme);
    state.theme = theme;
    applyResolvedMusicStyle(audio, theme, state.musicMode);
  };
  const toggleMusic = (): void => {
    setMusicEnabled(!audio.isMusicEnabled());
  };
  const setMusicEnabled = (enabled: boolean): void => {
    updateWebSettings((settings) => ({
      ...settings,
      audio: { ...settings.audio, musicEnabled: enabled },
    }));
    audio.setMusicEnabled(enabled);
    state.musicEnabled = enabled;
  };
  const setMusicMode = (mode: MusicMode): void => {
    updateWebSettings((settings) => ({
      ...settings,
      audio: { ...settings.audio, musicMode: mode },
    }));
    state.musicMode = mode;
    applyResolvedMusicStyle(audio, state.theme, mode);
  };
  const setVolume = (value: number): void => {
    const volume = clampVolume(value);
    const gain = volume / 100;
    updateWebSettings((settings) => ({
      ...settings,
      audio: { ...settings.audio, volume },
    }));
    audio.setMusicGain(gain);
    audio.setSoundGain(gain);
    state.volume = volume;
  };
  const setScreenControl = (enabled: boolean): void => {
    updateWebSettings((settings) => ({
      ...settings,
      controls: { ...settings.controls, screenControlEnabled: enabled },
    }));
    state.screenControlEnabled = enabled;
    window.dispatchEvent(
      new CustomEvent("screen-control-change", { detail: { enabled } }),
    );
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
  const settings = getWebSettings();
  const { musicEnabled, musicMode, volume } = settings.audio;
  const gain = volume / 100;
  audio.setMusicEnabled(musicEnabled);
  audio.setMusicGain(gain);
  audio.setSoundGain(gain);
  applyResolvedMusicStyle(audio, theme, musicMode);
}

function readState(audio: AudioRuntime): GlobalSettingsState {
  const settings = getWebSettings();
  return {
    locale: getWebLocale(),
    theme: getWebTheme(),
    musicEnabled: audio.isMusicEnabled(),
    musicMode: settings.audio.musicMode,
    volume: Math.round(audio.getMusicGain() * 100),
    screenControlEnabled: settings.controls.screenControlEnabled,
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
