<script setup lang="ts">
import type { AdventureSave } from "@bobby/adventure";
import type { MusicStyle } from "@bobby/engine";
import type { Locale } from "@bobby/i18n";
import type { GlobalSettingsState } from "../settings/useGlobalSettings.js";
import type { HelpDescriptor } from "../../shell/shellBridge.js";
import HelpDialog from "./HelpDialog.vue";
import SettingsDialog from "./SettingsDialog.vue";

defineProps<{
  kind: "settings" | "help";
  help: HelpDescriptor;
  settings: GlobalSettingsState;
  profile: AdventureSave;
  feedback: string;
}>();
const emit = defineEmits<{
  close: [];
  locale: [value: Locale];
  musicEnabled: [value: boolean];
  musicGain: [value: number];
  soundGain: [value: number];
  musicStyle: [value: MusicStyle];
  screenControl: [value: boolean];
  importSave: [save: AdventureSave];
  resetSave: [];
  feedback: [message: string];
}>();
</script>

<template>
  <div class="global-dialog-layer" data-dialog-layer @click.self="emit('close')">
    <SettingsDialog
      v-if="kind === 'settings'"
      :state="settings"
      :profile="profile"
      :feedback="feedback"
      @close="emit('close')"
      @locale="emit('locale', $event)"
      @music-enabled="emit('musicEnabled', $event)"
      @music-gain="emit('musicGain', $event)"
      @sound-gain="emit('soundGain', $event)"
      @music-style="emit('musicStyle', $event)"
      @screen-control="emit('screenControl', $event)"
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
  background: rgb(2 5 3 / 72%);
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
  box-shadow:
    0 20px 52px rgb(0 0 0 / 52%),
    8px 8px 0 #001b5b99;
}

.global-dialog.settings-dialog {
  width: min(660px, 100%);
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
