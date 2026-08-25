<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { TinySynthAudioBackend } from "../services/audio/TinySynthAudio.js";
import { useGlobalSettings } from "../shell/settings/useGlobalSettings.js";
import GlobalDialogLayer from "../shell/dialogs/GlobalDialogLayer.vue";
import AppBottomBar from "../shell/AppBottomBar.vue";
import AppTopBar from "../shell/AppTopBar.vue";
import HomeTopBar from "../shell/HomeTopBar.vue";
import type { Navigate } from "./pageContracts.js";
import type { ShellViewState } from "../shell/shellBridge.js";

const props = defineProps<{
  shell: ShellViewState;
  audio: TinySynthAudioBackend;
  navigate: Navigate;
  onContentReady: (element: HTMLDivElement) => void;
}>();
const content = ref<HTMLDivElement | null>(null);
const dialog = ref<"settings" | "help" | null>(null);
const settings = useGlobalSettings(props.audio);

function openDialog(kind: "settings" | "help", feedback = ""): void {
  if (kind === "settings") settings.refresh(feedback);
  dialog.value = kind;
  window.dispatchEvent(new CustomEvent("shell-dialog-open"));
}

function closeDialog(): void {
  if (!dialog.value) return;
  dialog.value = null;
  window.dispatchEvent(new CustomEvent("shell-dialog-close"));
}

function openSettings(feedback = ""): void {
  openDialog("settings", feedback);
}

function dispatchContextAction(action: string): void {
  window.dispatchEvent(
    new CustomEvent("game-shell-action", { detail: { action } }),
  );
}

function handleDelegatedAction(event: MouseEvent): void {
  const action = (event.target as HTMLElement)
    .closest<HTMLElement>("[data-action]")?.dataset.action;
  if (action === "settings") openSettings();
  else if (action === "help") openDialog("help");
}

defineExpose({ openSettings });
onMounted(() => {
  if (content.value) props.onContentReady(content.value);
});
</script>

<template>
  <div
    :class="shell.mode === 'home' ? 'home-root' : 'app-shell'"
    :data-mode="shell.mode"
    @click="handleDelegatedAction"
  >
    <HomeTopBar
      v-if="shell.mode === 'home'"
      key="home-topbar"
      :music-enabled="settings.state.musicEnabled"
      @toggle-music="settings.toggleMusic"
      @settings="openSettings()"
      @help="openDialog('help')"
    />
    <AppTopBar
      v-else-if="shell.topBarFixed"
      key="fixed-topbar"
      class="app-shell-fixed-top"
      :mode="shell.mode"
      :context-actions="shell.contextActions"
      :music-enabled="settings.state.musicEnabled"
      @navigate="navigate"
      @toggle-music="settings.toggleMusic"
      @settings="openSettings()"
      @help="openDialog('help')"
      @context-action="dispatchContextAction"
    />
    <div
      key="scroll-region"
      :class="shell.mode === 'home' ? 'home-scroll-region' : 'app-scroll-region'"
    >
      <AppTopBar
        v-if="shell.mode !== 'home' && !shell.topBarFixed"
        :mode="shell.mode"
        :context-actions="shell.contextActions"
        :music-enabled="settings.state.musicEnabled"
        @navigate="navigate"
        @toggle-music="settings.toggleMusic"
        @settings="openSettings()"
        @help="openDialog('help')"
        @context-action="dispatchContextAction"
      />
      <main ref="content" key="shell-content" class="app-content" />
      <AppBottomBar
        v-if="
          shell.mode !== 'home' &&
          shell.showBottomBar &&
          !shell.bottomBarFixed
        "
        :context-info="shell.contextInfo"
        :show-screen-control="shell.showScreenControlToggle"
        :screen-control-enabled="settings.state.screenControlEnabled"
        @toggle-screen-control="
          settings.setScreenControl(!settings.state.screenControlEnabled)
        "
      />
    </div>
    <AppBottomBar
      v-if="
        shell.mode !== 'home' &&
        shell.showBottomBar &&
        shell.bottomBarFixed
      "
      key="fixed-bottombar"
      class="app-shell-fixed-bottom"
      :context-info="shell.contextInfo"
      :show-screen-control="shell.showScreenControlToggle"
      :screen-control-enabled="settings.state.screenControlEnabled"
      @toggle-screen-control="
        settings.setScreenControl(!settings.state.screenControlEnabled)
      "
    />
    <GlobalDialogLayer
      v-if="dialog"
      :kind="dialog"
      :mode="shell.mode"
      :settings="settings.state"
      :feedback="settings.feedback.value"
      @close="closeDialog"
      @music-enabled="settings.setMusicEnabled"
      @music-volume="settings.setMusicVolume"
      @sound-volume="settings.setSoundVolume"
      @tone="settings.setTone"
      @reverb="settings.setReverb"
      @screen-control="settings.setScreenControl"
      @export-save="settings.exportSave"
      @import-save="settings.importSave"
      @reset-save="settings.resetSave"
      @feedback="settings.feedback.value = $event"
    />
  </div>
</template>
