import { reactive, ref } from "vue";
import type { TinySynthAudioBackend } from "../../services/audio/TinySynthAudio.js";
import {
  exportAdventureSave,
  importAdventureSave,
  loadAdventureSave,
  resetAdventureSave,
} from "../../storage/adventureSaveStorage.js";
import {
  loadScreenControlPreference,
  storeScreenControlPreference,
} from "../../shell/shellBridge.js";

export interface GlobalSettingsState {
  musicEnabled: boolean;
  musicVolume: number;
  soundVolume: number;
  tone: "fm" | "chip";
  reverb: number;
  screenControlEnabled: boolean;
  bonusCoins: number;
  goldenCarrots: number;
  completedLevels: number;
}

export function useGlobalSettings(audio: TinySynthAudioBackend) {
  const state = reactive<GlobalSettingsState>(readState(audio));
  const feedback = ref("");

  const refresh = (message = ""): void => {
    Object.assign(state, readState(audio));
    feedback.value = message;
  };
  const toggleMusic = (): void => {
    audio.setEnabled(!audio.isEnabled());
    state.musicEnabled = audio.isEnabled();
  };
  const setMusicEnabled = (enabled: boolean): void => {
    audio.setEnabled(enabled);
    state.musicEnabled = enabled;
  };
  const setMusicVolume = (value: number): void => {
    audio.setMusicVolume(value / 100);
    state.musicVolume = value;
  };
  const setSoundVolume = (value: number): void => {
    audio.setSoundVolume(value / 100);
    state.soundVolume = value;
  };
  const setTone = (tone: "fm" | "chip"): void => {
    audio.setTone(tone);
    state.tone = tone;
  };
  const setReverb = (value: number): void => {
    audio.setReverbLevel(value / 100);
    state.reverb = value;
  };
  const setScreenControl = (enabled: boolean): void => {
    state.screenControlEnabled = enabled;
    storeScreenControlPreference(enabled);
  };
  const importSave = async (file: File): Promise<void> => {
    try {
      await importAdventureSave(file);
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
    feedback,
    refresh,
    toggleMusic,
    setMusicEnabled,
    setMusicVolume,
    setSoundVolume,
    setTone,
    setReverb,
    setScreenControl,
    importSave,
    resetSave,
    exportSave: exportAdventureSave,
  };
}

function readState(audio: TinySynthAudioBackend): GlobalSettingsState {
  const save = loadAdventureSave();
  return {
    musicEnabled: audio.isEnabled(),
    musicVolume: Math.round(audio.getMusicVolume() * 100),
    soundVolume: Math.round(audio.getSoundVolume() * 100),
    tone: audio.getTone(),
    reverb: Math.round(audio.getReverbLevel() * 100),
    screenControlEnabled: loadScreenControlPreference(),
    bonusCoins: save.economy.bonusCoins,
    goldenCarrots: save.economy.goldenCarrots,
    completedLevels: save.campaign.completedLevels.length,
  };
}
