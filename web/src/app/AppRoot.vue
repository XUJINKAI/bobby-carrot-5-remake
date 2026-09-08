<script setup lang="ts">
import type { AudioRuntime } from "@bobby/engine";
import { onMounted, ref, watch } from "vue";
import { useGlobalSettings } from "./settings/useGlobalSettings.js";
import { localizeGlobalActions } from "./pageChrome.js";
import GlobalDialogLayer from "./dialogs/GlobalDialogLayer.vue";
import QuickSettingsPanel from "./dialogs/QuickSettingsPanel.vue";
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
const quickSettingsOpen = ref(false);
const helpOpen = ref(false);
const settings = useGlobalSettings(props.audio);

function openSettings(): void {
  settings.refresh();
  if (!quickSettingsOpen.value && !helpOpen.value) notifySurfaceOpen();
  helpOpen.value = false;
  quickSettingsOpen.value = true;
}

function closeSettings(): void {
  if (!quickSettingsOpen.value) return;
  quickSettingsOpen.value = false;
  notifySurfaceClose();
}

function openHelp(): void {
  if (!helpOpen.value && !quickSettingsOpen.value) notifySurfaceOpen();
  quickSettingsOpen.value = false;
  helpOpen.value = true;
}

function closeHelp(): void {
  if (!helpOpen.value) return;
  helpOpen.value = false;
  notifySurfaceClose();
}

function notifySurfaceOpen(): void {
  window.dispatchEvent(new CustomEvent("shell-dialog-open"));
}

function notifySurfaceClose(): void {
  window.dispatchEvent(new CustomEvent("shell-dialog-close"));
}

function openSettingsPage(): void {
  closeSettings();
  props.navigate("/settings");
}

function dispatchAction(action: string): void {
  if (action === "music") settings.toggleMusic();
  else if (action === "settings") openSettings();
  else if (action === "help") openHelp();
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
    ...(topBar?.leading ?? []),
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

    <div
      v-if="quickSettingsOpen"
      class="quick-settings-layer"
      data-quick-settings-layer
      @pointerdown.self="closeSettings"
    >
      <QuickSettingsPanel
        :state="settings.state"
        @close="closeSettings"
        @locale="settings.setLocale"
        @theme="settings.setTheme"
        @music-mode="settings.setMusicMode"
        @volume="settings.setVolume"
        @more-settings="openSettingsPage"
      />
    </div>

    <GlobalDialogLayer
      v-if="helpOpen"
      :help="shell.help"
      @close="closeHelp"
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
  color: var(--bc-text);
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

.app-content:not(:has(.game-page)):not(:has(.adventure-viewport)):not(:has(.bobby-editor)):not(:has(.home-page)) {
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
  min-height: 100%;
  margin: 0;
  padding: 0;
}

.app-content:has(.adventure-viewport) {
  width: 100%;
  min-height: 0;
  height: 100%;
  margin: 0;
  padding: 0;
}

.quick-settings-layer {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: calc(58px + max(8px, env(safe-area-inset-top))) 12px 12px;
  background: transparent;
}

@media (max-width: 480px) {
  .quick-settings-layer {
    padding-inline: 8px;
  }
}
</style>
