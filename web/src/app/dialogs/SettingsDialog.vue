<script setup lang="ts">
import { serializeAdventureSave, type AdventureSave } from "@bobby/adventure";
import type { MusicStyle } from "@bobby/engine";
import { ref } from "vue";
import type { GlobalSettingsState } from "../settings/useGlobalSettings.js";
import { publicBaseUrl } from "../../services/assets/gameAssets.js";
import DataExchangePanel from "../../shared/data-exchange/DataExchangePanel.vue";
import { parseAdventureProfileExchange } from "../../storage/adventureSaveStorage.js";

defineProps<{
  state: GlobalSettingsState;
  profile: AdventureSave;
  feedback: string;
}>();
const emit = defineEmits<{
  close: [];
  musicEnabled: [value: boolean];
  musicGain: [value: number];
  soundGain: [value: number];
  musicStyle: [value: MusicStyle];
  screenControl: [value: boolean];
  importSave: [save: AdventureSave];
  resetSave: [];
  feedback: [message: string];
}>();
const resetConfirming = ref(false);
const pendingProfile = ref<AdventureSave | null>(null);
const toolbar = {
  left: [
    { type: "importText" as const, label: "导入" },
    { type: "importFile" as const, label: "导入文件" },
  ],
  right: [
    { type: "status" as const },
    { type: "compress" as const, label: "压缩" },
    { type: "copy" as const, label: "复制" },
    { type: "download" as const, label: "下载" },
  ],
};

function numberValue(event: Event): number {
  return Number((event.target as HTMLInputElement).value);
}

function parseProfile(value: unknown): AdventureSave {
  return parseAdventureProfileExchange(value);
}

function serializeProfile(value: unknown): string {
  return serializeAdventureSave(value as AdventureSave);
}

function confirmImport(): void {
  if (!pendingProfile.value) return;
  emit("importSave", pendingProfile.value);
  pendingProfile.value = null;
}

function requestReset(): void {
  if (!resetConfirming.value) {
    resetConfirming.value = true;
    emit("feedback", "自由探索记录会继续保留。");
    return;
  }
  emit("resetSave");
}
</script>

<template>
  <section class="global-dialog settings-dialog" role="dialog" aria-label="设置">
    <header>设置 <button type="button" aria-label="关闭" @click="emit('close')">×</button></header>
    <div>
      <h3>音频</h3>
      <label>音乐 <input type="checkbox" :checked="state.musicEnabled" @change="emit('musicEnabled', ($event.target as HTMLInputElement).checked)"></label>
      <label>音乐增益 {{ state.musicGain }}% <input type="range" min="0" max="200" :value="state.musicGain" @input="emit('musicGain', numberValue($event))"></label>
      <label>音效增益 {{ state.soundGain }}% <input type="range" min="0" max="200" :value="state.soundGain" @input="emit('soundGain', numberValue($event))"></label>
      <div class="music-style-setting">
        <span>音乐风格</span>
        <div class="music-style-options" role="radiogroup" aria-label="音乐风格">
          <button
            type="button"
            role="radio"
            :aria-checked="state.musicStyle === 'modern'"
            :class="{ selected: state.musicStyle === 'modern' }"
            @click="emit('musicStyle', 'modern')"
          >现代风格</button>
          <button
            type="button"
            role="radio"
            :aria-checked="state.musicStyle === '8bit'"
            :class="{ selected: state.musicStyle === '8bit' }"
            @click="emit('musicStyle', '8bit')"
          >8bit 风格</button>
        </div>
      </div>
      <h3>操作</h3>
      <label>屏幕摇杆 <input type="checkbox" :checked="state.screenControlEnabled" @change="emit('screenControl', ($event.target as HTMLInputElement).checked)"></label>
      <h3>Adventure Save</h3>
      <p class="settings-save-summary">Bonus Coin {{ state.bonusCoins }} · Golden Carrot {{ state.goldenCarrots }} · 已完成 {{ state.completedLevels }}</p>
      <DataExchangePanel
        :value="profile"
        :serialize="serializeProfile"
        :parse="parseProfile"
        :public-base-url="publicBaseUrl()"
        :filename="`bc5r-save-${new Date().toISOString().slice(0, 10)}`"
        placeholder="粘贴 Adventure Profile JSON、BC5R 文本或分享链接……"
        :toolbar="toolbar"
        @import="pendingProfile = $event as AdventureSave"
        @error="emit('feedback', $event.message)"
      />
      <div v-if="pendingProfile" class="settings-import-confirm">
        <p>导入将覆盖当前 Adventure Profile。</p>
        <button type="button" @click="pendingProfile = null">取消</button>
        <button type="button" @click="confirmImport">导入并覆盖</button>
      </div>
      <div class="settings-save-actions">
        <button type="button" @click="requestReset">{{ resetConfirming ? "再次点击确认清空" : "清空" }}</button>
      </div>
      <p class="settings-feedback" aria-live="polite">{{ feedback }}</p>
    </div>
  </section>
</template>

<style scoped>
.music-style-setting {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.music-style-options {
  display: grid;
  min-width: 132px;
  gap: 5px;
}

.music-style-options button {
  min-height: 34px;
  padding: 6px 12px;
  border: 1px solid #000;
  border-radius: 7px;
  background: #fff;
  color: #000;
  cursor: pointer;
}

.music-style-options button.selected {
  background: #000;
  color: #fff;
}

.settings-save-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.settings-save-summary,
.settings-feedback {
  color: var(--muted);
  font-size: 0.78rem;
}

.settings-feedback {
  min-height: 1.2em;
}
</style>
