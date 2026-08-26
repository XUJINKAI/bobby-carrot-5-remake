<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { TinySynthAudioBackend } from "../services/audio/TinySynthAudio.js";
import { useGlobalSettings } from "./settings/useGlobalSettings.js";
import GlobalDialogLayer from "./dialogs/GlobalDialogLayer.vue";
import AppBottomBar from "../shell/AppBottomBar.vue";
import AppTopBar from "../shell/AppTopBar.vue";
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

function dispatchAction(action: string): void {
  if (action === "music") {
    settings.toggleMusic();
    updateActionPressed("music", settings.state.musicEnabled);
  }
  else if (action === "settings") openSettings();
  else if (action === "help") openDialog("help");
  else if (action === "screen-control") {
    settings.setScreenControl(!settings.state.screenControlEnabled);
    updateActionPressed("screen-control", settings.state.screenControlEnabled);
  } else {
    window.dispatchEvent(
      new CustomEvent("game-shell-action", { detail: { action } }),
    );
  }
}

function updateActionPressed(id: string, pressed: boolean): void {
  const topBar = props.shell.config.topBar;
  const bottomBar = props.shell.config.bottomBar;
  const actions = [
    ...(topBar?.back ? [topBar.back] : []),
    ...(topBar?.commands ?? []),
    ...(topBar?.actions ?? []),
    ...(bottomBar?.leading ?? []),
    ...(bottomBar?.trailing ?? []),
  ];
  const target = actions.find((item) => item.id === id);
  if (target) target.pressed = pressed;
}

defineExpose({ openSettings });
onMounted(() => {
  if (content.value) props.onContentReady(content.value);
});
</script>

<template>
  <div class="app-shell" data-shell>
    <AppTopBar
      v-if="shell.config.topBar?.visible !== false && shell.config.topBar?.fixed !== false"
      key="fixed-topbar"
      class="app-shell-fixed-top"
      :config="shell.config.topBar ?? {}"
      @navigate="navigate"
      @action="dispatchAction"
    />
    <div key="scroll-region" class="app-scroll-region">
      <AppTopBar
        v-if="shell.config.topBar?.visible !== false && shell.config.topBar?.fixed === false"
        :config="shell.config.topBar ?? {}"
        @navigate="navigate"
        @action="dispatchAction"
      />
      <main ref="content" key="shell-content" class="app-content" />
      <AppBottomBar
        v-if="shell.config.bottomBar?.visible && shell.config.bottomBar.fixed === false"
        :config="shell.config.bottomBar"
        @navigate="navigate"
        @action="dispatchAction"
      />
    </div>
    <AppBottomBar
      v-if="shell.config.bottomBar?.visible && shell.config.bottomBar.fixed !== false"
      key="fixed-bottombar"
      class="app-shell-fixed-bottom"
      :config="shell.config.bottomBar"
      @navigate="navigate"
      @action="dispatchAction"
    />
    <GlobalDialogLayer
      v-if="dialog"
      :kind="dialog"
      :help="shell.help"
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
