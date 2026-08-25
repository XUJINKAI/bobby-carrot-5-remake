<script setup lang="ts">
import type { GlobalSettingsState } from "../settings/useGlobalSettings.js";
import type { AppMode } from "../shellBridge.js";
import HelpDialog from "./HelpDialog.vue";
import SettingsDialog from "./SettingsDialog.vue";

defineProps<{
  kind: "settings" | "help";
  mode: AppMode;
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
    <HelpDialog v-else :mode="mode" @close="emit('close')" />
  </div>
</template>
