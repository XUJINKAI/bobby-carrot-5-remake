<script setup lang="ts">
import { ref } from "vue";
import type { GlobalSettingsState } from "../settings/useGlobalSettings.js";

defineProps<{ state: GlobalSettingsState; feedback: string }>();
const emit = defineEmits<{
  close: [];
  musicEnabled: [value: boolean];
  musicVolume: [value: number];
  soundVolume: [value: number];
  tone: [value: "fm" | "chip"];
  reverb: [value: number];
  screenControl: [value: boolean];
  exportSave: [];
  importSave: [file: File];
  resetSave: [];
  feedback: [message: string];
}>();
const resetConfirming = ref(false);

function numberValue(event: Event): number {
  return Number((event.target as HTMLInputElement).value);
}

function importFile(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit("importSave", file);
  input.value = "";
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
      <label>音乐音量 <input type="range" min="0" max="100" :value="state.musicVolume" @input="emit('musicVolume', numberValue($event))"></label>
      <label>音效音量 <input type="range" min="0" max="100" :value="state.soundVolume" @input="emit('soundVolume', numberValue($event))"></label>
      <label>MIDI 音色 <select :value="state.tone" @change="emit('tone', ($event.target as HTMLSelectElement).value === 'chip' ? 'chip' : 'fm')"><option value="fm">TinySynth FM</option><option value="chip">TinySynth Chip</option></select></label>
      <label>混响 <input type="range" min="0" max="100" :value="state.reverb" @input="emit('reverb', numberValue($event))"></label>
      <h3>操作</h3>
      <label>屏幕摇杆 <input type="checkbox" :checked="state.screenControlEnabled" @change="emit('screenControl', ($event.target as HTMLInputElement).checked)"></label>
      <h3>Adventure Save</h3>
      <p class="settings-save-summary">Bonus Coin {{ state.bonusCoins }} · Golden Carrot {{ state.goldenCarrots }} · 已完成 {{ state.completedLevels }}</p>
      <div class="settings-save-actions">
        <button type="button" @click="emit('exportSave')">导出</button>
        <label class="settings-file-button">导入<input type="file" accept="application/json,.json" hidden @change="importFile"></label>
        <button type="button" @click="requestReset">{{ resetConfirming ? "再次点击确认清空" : "清空" }}</button>
      </div>
      <p class="settings-feedback" aria-live="polite">{{ feedback }}</p>
    </div>
  </section>
</template>

<style scoped>
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
