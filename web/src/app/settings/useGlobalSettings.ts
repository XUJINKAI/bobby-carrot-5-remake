import type { AdventureSave } from "@bobby/adventure";
import type { AudioRuntime, MusicStyle } from "@bobby/engine";
import type { Locale } from "@bobby/i18n";
import { reactive, ref } from "vue";
import {
  loadAdventureSave,
  resetAdventureSave,
  saveAdventureSave,
} from "../../storage/adventureSaveStorage.js";
import {
  loadScreenControlPreference,
  storeScreenControlPreference,
} from "../../shell/shellBridge.js";
import { getWebLocale, setWebLocale } from "../../i18n/webI18n.js";

const MUSIC_ENABLED_KEY = "bobby.musicEnabled";
const MUSIC_GAIN_KEY = "bobby.musicGain";
const SOUND_GAIN_KEY = "bobby.soundGain";
const MUSIC_STYLE_KEY = "bobby.musicStyle";

export interface GlobalSettingsState {
  locale: Locale;
  musicEnabled: boolean;
  musicGain: number;
  soundGain: number;
  musicStyle: MusicStyle;
  screenControlEnabled: boolean;
  bonusCoins: number;
  goldenCarrots: number;
  completedLevels: number;
}

export function useGlobalSettings(audio: AudioRuntime) {
  applyStoredAudioSettings(audio);
  const state = reactive<GlobalSettingsState>(readState(audio));
  const feedback = ref("");
  const profile = ref(loadAdventureSave());

  const refresh = (message = ""): void => {
    Object.assign(state, readState(audio));
    profile.value = loadAdventureSave();
    feedback.value = message;
  };
  const setLocale = (locale: Locale): void => {
    setWebLocale(locale);
    state.locale = locale;
  };
  const toggleMusic = (): void => {
    setMusicEnabled(!audio.isMusicEnabled());
  };
  const setMusicEnabled = (enabled: boolean): void => {
    audio.setMusicEnabled(enabled);
    localStorage.setItem(MUSIC_ENABLED_KEY, String(enabled));
    state.musicEnabled = enabled;
  };
  const setMusicGain = (value: number): void => {
    const gain = percentageToGain(value);
    audio.setMusicGain(gain);
    localStorage.setItem(MUSIC_GAIN_KEY, String(gain));
    state.musicGain = Math.round(gain * 100);
  };
  const setSoundGain = (value: number): void => {
    const gain = percentageToGain(value);
    audio.setSoundGain(gain);
    localStorage.setItem(SOUND_GAIN_KEY, String(gain));
    state.soundGain = Math.round(gain * 100);
  };
  const setMusicStyle = (style: MusicStyle): void => {
    audio.setMusicStyle(style);
    localStorage.setItem(MUSIC_STYLE_KEY, style);
    state.musicStyle = style;
  };
  const setScreenControl = (enabled: boolean): void => {
    state.screenControlEnabled = enabled;
    storeScreenControlPreference(enabled);
  };
  const importSave = (save: AdventureSave): void => {
    try {
      saveAdventureSave(save);
      refresh("Adventure 存档已导入。");
    } catch (error) {
      feedback.value = error instanceof Error ? error.message : String(error);
    }
  };
  const resetSave = (): void => {
    resetAdventureSave();
    refresh("Adventure 存档已清空。");
  };

  return {
    state,
    profile,
    feedback,
    refresh,
    setLocale,
    toggleMusic,
    setMusicEnabled,
    setMusicGain,
    setSoundGain,
    setMusicStyle,
    setScreenControl,
    importSave,
    resetSave,
  };
}

function applyStoredAudioSettings(audio: AudioRuntime): void {
  audio.setMusicEnabled(localStorage.getItem(MUSIC_ENABLED_KEY) !== "false");
  audio.setMusicGain(storedGain(MUSIC_GAIN_KEY, 0.42));
  audio.setSoundGain(storedGain(SOUND_GAIN_KEY, 0.45));
  audio.setMusicStyle(
    localStorage.getItem(MUSIC_STYLE_KEY) === "modern" ? "modern" : "8bit",
  );
}

function readState(audio: AudioRuntime): GlobalSettingsState {
  const save = loadAdventureSave();
  return {
    locale: getWebLocale(),
    musicEnabled: audio.isMusicEnabled(),
    musicGain: Math.round(audio.getMusicGain() * 100),
    soundGain: Math.round(audio.getSoundGain() * 100),
    musicStyle: audio.getMusicStyle(),
    screenControlEnabled: loadScreenControlPreference(),
    bonusCoins: save.economy.bonusCoins,
    goldenCarrots: save.economy.goldenCarrots,
    completedLevels: save.campaign.completedLevels.length,
  };
}

function storedGain(key: string, fallback: number): number {
  const value = Number(localStorage.getItem(key) ?? fallback);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function percentageToGain(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, value) / 100;
}
