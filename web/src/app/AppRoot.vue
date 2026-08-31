<script setup lang="ts">
import type { AudioRuntime } from "@bobby/engine";
import { onMounted, ref, watch } from "vue";
import { useGlobalSettings } from "./settings/useGlobalSettings.js";
import { localizeGlobalActions } from "./pageChrome.js";
import GlobalDialogLayer from "./dialogs/GlobalDialogLayer.vue";
import AppBottomBar from "../shell/AppBottomBar.vue";
import AppTopBar from "../shell/AppTopBar.vue";
import type { Navigate } from "./pageContracts.js";
import type { ShellViewState } from "../shell/shellBridge.js";

const props = defineProps<{
  shell: ShellViewState;
  audio: AudioRuntime;
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
  if (action === "music") settings.toggleMusic();
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

function shellActions() {
  const topBar = props.shell.config.topBar;
  const bottomBar = props.shell.config.bottomBar;
  return [
    ...(topBar?.back ? [topBar.back] : []),
    ...(topBar?.commands ?? []),
    ...(topBar?.actions ?? []),
    ...(bottomBar?.leading ?? []),
    ...(bottomBar?.trailing ?? []),
  ];
}

function updateActionPressed(id: string, pressed: boolean): void {
  const target = shellActions().find((item) => item.id === id);
  if (target) target.pressed = pressed;
}

watch(
  [() => settings.state.musicEnabled, () => props.shell.config],
  ([musicEnabled]) => updateActionPressed("music", musicEnabled),
  { immediate: true },
);

watch(
  [() => settings.state.locale, () => props.shell.config],
  () => localizeGlobalActions(shellActions()),
  { immediate: true },
);

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
      :profile="settings.profile.value"
      :feedback="settings.feedback.value"
      @close="closeDialog"
      @locale="settings.setLocale"
      @music-enabled="settings.setMusicEnabled"
      @music-gain="settings.setMusicGain"
      @sound-gain="settings.setSoundGain"
      @music-style="settings.setMusicStyle"
      @screen-control="settings.setScreenControl"
      @import-save="settings.importSave"
      @reset-save="settings.resetSave"
      @feedback="settings.feedback.value = $event"
    />
  </div>
</template>

<style>
.app-shell {
  height: 100vh;
  height: 100dvh;
  display: grid;
  grid-template-areas:
    "top"
    "scroll"
    "bottom";
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  background: var(--bc-bg);
}

.app-shell-fixed-top {
  grid-area: top;
}

.app-shell-fixed-bottom {
  grid-area: bottom;
}

.app-scroll-region {
  grid-area: scroll;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.app-content {
  min-height: 100%;
  flex: 1 0 auto;
}

.app-content:not(:has(.game-page)):not(:has(.adventure-desktop)):not(:has(.bobby-editor)) {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 34px 0 60px;
}

.app-content:has(.bobby-editor) {
  width: 100%;
  min-height: 0;
  height: 100%;
  padding: 0;
}

.app-content:has(.home-page) {
  width: 100%;
  padding: 0;
}

.app-content > .adventure-desktop {
  min-height: 100%;
  height: 100%;
}

.app-content > .adventure-desktop .adventure-phone {
  width: auto;
  max-width: 100%;
  height: 100%;
  aspect-ratio: 5 / 8;
}
</style>
