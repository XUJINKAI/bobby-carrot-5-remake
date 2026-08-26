<script setup lang="ts">
import type { GlobalSettingsState } from "../settings/useGlobalSettings.js";
import type { HelpDescriptor } from "../../shell/shellBridge.js";
import HelpDialog from "./HelpDialog.vue";
import SettingsDialog from "./SettingsDialog.vue";

defineProps<{
  kind: "settings" | "help";
  help: HelpDescriptor;
  settings: GlobalSettingsState;
  feedback: string;
}>();
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
</script>

<template>
  <div class="global-dialog-layer" data-dialog-layer @click.self="emit('close')">
    <SettingsDialog
      v-if="kind === 'settings'"
      :state="settings"
      :feedback="feedback"
      @close="emit('close')"
      @music-enabled="emit('musicEnabled', $event)"
      @music-volume="emit('musicVolume', $event)"
      @sound-volume="emit('soundVolume', $event)"
      @tone="emit('tone', $event)"
      @reverb="emit('reverb', $event)"
      @screen-control="emit('screenControl', $event)"
      @export-save="emit('exportSave')"
      @import-save="emit('importSave', $event)"
      @reset-save="emit('resetSave')"
      @feedback="emit('feedback', $event)"
    />
    <HelpDialog v-else :descriptor="help" @close="emit('close')" />
  </div>
</template>

<style>
.global-dialog-layer {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: #02050399;
  backdrop-filter: blur(4px);
  z-index: 50;
}

.global-dialog {
  width: min(430px, 100%);
  max-height: min(76vh, 620px);
  overflow: auto;
  border: 3px solid var(--bc-panel-border);
  border-radius: 7px;
  background: var(--bc-panel);
  color: #eef5ef;
  box-shadow: 8px 8px 0 #001b5b99;
}

.global-dialog > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #ffffff12;
}

.global-dialog > header button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.4rem;
}

.global-dialog > div {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.global-dialog h3,
.global-dialog p {
  margin: 0;
}

.global-dialog label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.global-dialog select,
.settings-save-actions button {
  min-height: 34px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: #17251b;
  color: inherit;
}
</style>
