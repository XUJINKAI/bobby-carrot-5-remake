<script setup lang="ts">
import {
  validateEditorLevel,
  type EditorMap,
  type LevelValidationIssue,
} from "@bobby/editor";
import {
  resolveLevelMusic,
  type AudioBackend,
  type ImageManager,
} from "@bobby/engine";
import type { MapMusic } from "@bobby/model";
import type { GameSession } from "../../runtime/game/createGameSession.js";
import { createGameSession } from "../../runtime/game/createGameSession.js";
import { bindGameplayShell } from "../../runtime/game/bindGameplayShell.js";
import {
  bindReplayPanel,
  type ReplayPanelController,
} from "../game/bindReplayPanel.js";
import { getWebSettings } from "../../storage/settingsStorage.js";
import { storeEditorAutosave } from "../../storage/editorDraftStorage.js";
import { getWebLocale, webT } from "../../i18n/webI18n.js";
import type { Navigate } from "../../app/pageContracts.js";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import EditorFileDialog from "./EditorFileDialog.vue";
import EditorWorkspace from "./EditorWorkspace.vue";
import { configureEditorShell } from "./editorShell.js";
import { useEditorPage } from "./useEditorPage.js";
import { FREE_GAMEPLAY_CAMERA_OPTIONS } from "../game/gameplayCameraOptions.js";
import { mapStatusIndicator } from "../game/mapStatusIndicator.js";

const props = defineProps<{
  initialLevel: EditorMap;
  audio: AudioBackend;
  images: ImageManager;
  navigate: Navigate;
  playRoute?: boolean;
}>();
const page = useEditorPage(props.initialLevel);
page.surfaceTool.value = "rect";
let session: GameSession | null = null;
let replayPanel: ReplayPanelController | null = null;
let disposePlayChange = (): void => {};
let disposeGameplayShell = (): void => {};
let playResultLease: ReturnType<GameSession["gates"]["acquire"]> | null = null;
const startsMobile = window.matchMedia("(max-width: 620px)").matches;
const editorRoot = ref<HTMLElement | null>(null);
const leftOpen = ref(true);
const rightPanel = ref<"inspector" | "level" | null>(
  startsMobile ? null : "inspector",
);
const playResult = ref<"complete" | "death" | null>(null);
const replayOpen = ref(false);
const screenControlEnabled = ref(
  getWebSettings().controls.screenControlEnabled,
);
const runtimeIssue = ref<LevelValidationIssue | null>(null);
const musicPreviewing = ref(false);
const issues = computed(() =>
  validateEditorLevel(
    page.snapshot.value.level as EditorMap,
    page.environment,
    page.editor,
  ),
);
const shellIssues = computed<readonly LevelValidationIssue[]>(() =>
  runtimeIssue.value ? [...issues.value, runtimeIssue.value] : issues.value,
);

function syncShell(): void {
  configureEditorShell(
    page.playing.value,
    page.tool.value,
    shellIssues.value,
    {
      canUndo: session?.game.canUndo ?? false,
      canRedo: session?.game.canRedo ?? false,
      replayReady: replayPanel !== null,
      replayOpen: replayOpen.value,
      screenControlEnabled: screenControlEnabled.value,
      mapIndicator: page.playing.value
        ? editorMapStatusIndicator()
        : null,
    },
    page.leftPanel.value,
    page.surfaceTool.value,
  );
}

function editorMapStatusIndicator() {
  const level = page.snapshot.value.level as EditorMap;
  const name = page.nameValue.value.trim() || webT("editor.untitled");
  return mapStatusIndicator("editor-draft", "editor/draft", name, {
    ...level.meta,
    name,
    author: page.authorValue.value,
    note: page.noteValue.value,
  });
}
watch(
  () => [
    page.playing.value,
    page.tool.value,
    page.leftPanel.value,
    page.surfaceTool.value,
    getWebLocale(),
    shellIssues.value.map((issue) => `${issue.level}:${issue.message}`).join("|"),
  ],
  () => {
    syncShell();
    replayPanel?.update();
  },
);

async function togglePlay(): Promise<void> {
  stopMusicPreview();
  if (!props.playRoute) {
    openPlayRoute();
    return;
  }
  if (page.playing.value) {
    exitPlayRoute();
    return;
  }
  runtimeIssue.value = null;
  playResult.value = null;
  page.playing.value = true;
  syncShell();
  await nextTick();
  try {
    const canvas = document.querySelector<HTMLCanvasElement>("#editor-game");
    if (!canvas) throw new Error("Editor Play Test 舞台挂载失败");
    session = await createGameSession({
      canvas,
      level: page.levelMap.value,
      gameOptions: {
        images: props.images,
        audio: props.audio,
        environment: page.environment,
        debug: false,
      },
      runtime: {
        camera: FREE_GAMEPLAY_CAMERA_OPTIONS,
        hud: true,
        input: {
          undo: true,
          debug: true,
          screenJoystick: {
            enabled: screenControlEnabled.value,
          },
        },
      },
    });
    disposeGameplayShell = bindGameplayShell(session, {
      initialScreenControlEnabled: screenControlEnabled.value,
      onScreenControlChange(enabled) {
        screenControlEnabled.value = enabled;
        syncShell();
      },
    });
    const root = editorRoot.value;
    if (!root) throw new Error("Editor Play Test 页面挂载失败");
    replayPanel = bindReplayPanel({
      root,
      game: session.game,
      filename: `editor-${page.nameValue.value || "map"}`,
      meta: {
        id: "editor/draft",
        url: window.location.href,
      },
      initialOpen: false,
      onVisibilityChange(open) {
        replayOpen.value = open;
        syncShell();
      },
      onTimelineRestart() {
        playResult.value = null;
        playResultLease?.release();
        playResultLease = null;
      },
    });
    bindPlaySession();
  } catch (error) {
    disposeGameplayShell();
    disposeGameplayShell = (): void => {};
    session?.destroy();
    session = null;
    props.audio.stopMusic();
    page.playing.value = false;
    runtimeIssue.value = {
      level: "error",
      message: `Play Test：${error instanceof Error ? error.message : String(error)}`,
    };
    syncShell();
  }
}

function openPlayRoute(): void {
  page.flushMetadata();
  storeEditorAutosave(page.snapshot.value.level as EditorMap);
  props.navigate("/edit/test", {
    state: { editorTestSource: true },
  });
}

function exitPlayRoute(): void {
  if (history.state?.editorTestSource === true) {
    history.back();
    return;
  }
  props.navigate("/edit", { replace: true });
}

function bindPlaySession(): void {
  disposePlayChange();
  disposePlayChange = session?.game.on("change", syncPlayState) ?? (() => {});
  syncPlayState();
}
function syncPlayState(): void {
  if (!session) return;
  const status = session.game.state.status;
  const terminalResult = status === "won"
    ? "complete"
    : status === "dead"
      ? "death"
      : null;
  const nextResult = terminalResult && !session.game.isAnimating
    ? terminalResult
    : null;
  const previousResult = playResult.value;
  playResult.value = nextResult;
  if (nextResult && !playResultLease)
    playResultLease = session.gates.acquire("play-result");
  else if (!nextResult && previousResult) {
    playResultLease?.release();
    playResultLease = null;
  }
  replayPanel?.update();
  syncShell();
}
function stopPlay(): void {
  disposePlayChange();
  disposePlayChange = (): void => {};
  replayPanel?.destroy();
  replayPanel = null;
  replayOpen.value = false;
  playResult.value = null;
  playResultLease?.release();
  playResultLease = null;
  disposeGameplayShell();
  disposeGameplayShell = (): void => {};
  session?.destroy();
  session = null;
  props.audio.stopMusic();
  musicPreviewing.value = false;
  page.playing.value = false;
  syncShell();
}
function restartPlay(): void {
  if (!session) return;
  playResult.value = null;
  playResultLease?.release();
  playResultLease = null;
  session.game.restart();
  replayPanel?.update();
  syncShell();
}
function undo(): void {
  if (page.playing.value) session?.game.undo();
  else page.document.undo();
}
function redo(): void {
  if (page.playing.value) session?.game.redo();
  else page.document.redo();
}
function importLevel(level: EditorMap): void {
  page.loadLevel(level);
  page.fileDialogOpen.value = false;
}
function markDownloaded(): void {
  page.document.markSaved();
}

function setMusic(music: MapMusic | undefined): void {
  stopMusicPreview();
  page.setMusic(music);
}

function toggleMusicPreview(): void {
  if (musicPreviewing.value) {
    stopMusicPreview();
    return;
  }
  const track = resolveLevelMusic(page.snapshot.value.level.music);
  if (!track) return;
  props.audio.resume();
  props.audio.playMusic(track);
  musicPreviewing.value = true;
}

function stopMusicPreview(): void {
  if (!musicPreviewing.value) return;
  props.audio.stopMusic();
  musicPreviewing.value = false;
}

function selectAll(): void {
  const level = page.snapshot.value.level as EditorMap;
  page.mapSelection.value = {
    anchor: { x: 0, y: 0 },
    focus: { x: level.width - 1, y: level.height - 1 },
  };
}

function switchAuthoringPanel(): void {
  page.toggleAuthoringPanel();
  leftOpen.value = true;
  if (isMobileEditor()) rightPanel.value = null;
  syncShell();
}

function handleKeydown(event: KeyboardEvent): void {
  if (isTextInput(event.target)) return;
  const modifier = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  if (page.playing.value) return;
  if (event.key === "Tab" && !modifier && !event.altKey) {
    event.preventDefault();
    switchAuthoringPanel();
    return;
  }
  if (modifier && key === "a") {
    event.preventDefault();
    selectAll();
  } else if (modifier && key === "z" && !event.shiftKey) {
    event.preventDefault();
    undo();
  } else if (modifier && key === "y" && !event.shiftKey) {
    event.preventDefault();
    redo();
  } else if (modifier && key === "c") {
    event.preventDefault();
    page.copy();
  } else if (modifier && key === "x") {
    event.preventDefault();
    page.cut();
  } else if (modifier && key === "v") {
    event.preventDefault();
    const origin = page.hover.value ?? page.mapSelection.value?.anchor;
    if (origin) page.paste(origin);
  } else if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    page.deleteSelection();
  } else if (page.leftPanel.value === "surface") {
    if (key === "1") {
      event.preventDefault();
      page.setSurfaceTool("rect");
    } else if (key === "2") {
      event.preventDefault();
      page.setSurfaceTool("brush");
    } else if (key === "3") {
      event.preventDefault();
      page.setSurfaceTool("fill");
    }
  } else if (key === "1") {
    event.preventDefault();
    page.setTool("select");
  } else if (key === "2") {
    event.preventDefault();
    page.setTool("place");
  } else if (key === "4") {
    event.preventDefault();
    page.setTool("erase");
  } else if (key === "q" || key === "e") {
    event.preventDefault();
    page.cycleVariant(key === "q" ? -1 : 1);
  }
}

function onShellAction(event: Event): void {
  const action = (event as CustomEvent<{ action: string }>).detail.action;
  if (action === "editor-tool-select") page.setTool("select");
  if (action === "editor-tool-brush") page.setTool("place");
  if (action === "editor-tool-erase") page.setTool("erase");
  if (action === "editor-surface-select") page.setSurfaceTool("rect");
  if (action === "editor-surface-brush") page.setSurfaceTool("brush");
  if (action === "editor-surface-fill") page.setSurfaceTool("fill");
  if (action === "editor-undo") undo();
  if (action === "editor-redo") redo();
  if (action === "editor-play") void togglePlay();
  if (action === "editor-restart") restartPlay();
  if (action === "editor-replay-record") replayPanel?.toggle();
  if (action === "editor-share") page.fileDialogOpen.value = true;
  if (action === "editor-palette") toggleLeftPanel("palette");
  if (action === "editor-surface") toggleLeftPanel("surface");
  if (action === "editor-inspector") toggleRightPanel("inspector");
  if (action === "editor-level-info") toggleRightPanel("level");
}

function toggleLeftPanel(panel: "palette" | "surface"): void {
  const opening = !leftOpen.value || page.leftPanel.value !== panel;
  if (panel === "surface") page.activateSurface();
  else page.activatePalette();
  leftOpen.value = opening;
  if (isMobileEditor() && opening) rightPanel.value = null;
}

function toggleRightPanel(panel: "inspector" | "level"): void {
  const opening = rightPanel.value !== panel;
  if (isMobileEditor()) leftOpen.value = false;
  rightPanel.value = opening ? panel : null;
}

function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (page.snapshot.value.dirty) event.preventDefault();
}

onMounted(() => {
  syncShell();
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("game-shell-action", onShellAction);
  window.addEventListener("beforeunload", onBeforeUnload);
  if (props.playRoute) void togglePlay();
});
onBeforeUnmount(() => {
  stopPlay();
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("game-shell-action", onShellAction);
  window.removeEventListener("beforeunload", onBeforeUnload);
});

function isTextInput(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}
function isMobileEditor(): boolean {
  return window.matchMedia("(max-width: 620px)").matches;
}
</script>

<template>
  <div
    ref="editorRoot"
    class="bobby-editor"
    :class="{
      'palette-sheet-open': leftOpen,
      'inspector-sheet-open': rightPanel !== null,
    }"
  >
    <EditorWorkspace
      :level="page.snapshot.value.level as EditorMap"
      :name-value="page.nameValue.value"
      :author-value="page.authorValue.value"
      :note-value="page.noteValue.value"
      :revision="page.snapshot.value.revision"
      :tool="page.tool.value"
      :placement="page.leftPanel.value === 'palette' ? page.placement.value : null"
      :palette-placement="page.placement.value"
      :left-panel="page.leftPanel.value"
      :surface-tool="page.surfaceTool.value"
      :surface-brush="page.surfaceBrush.value"
      :surface-theme="page.surfaceTheme.value"
      :selection="page.mapSelection.value"
      :hover="page.hover.value"
      :inspector="page.inspector.value"
      :hover-inspector="page.hoverInspector.value"
      :placement-inspector-preview="page.placementInspectorPreview.value"
      :deletion-target-index="page.deletionTargetIndex.value"
      :rules="page.rules.value"
      :rule-mode="page.ruleMode.value"
      :music-previewing="musicPreviewing"
      :palette="page.palette"
      :palette-size="page.paletteSize.value"
      :left-open="leftOpen"
      :right-panel="rightPanel"
      :playing="page.playing.value"
      :play-result="playResult"
      :images="props.images"
      :environment="page.environment"
      :catalog="page.catalog"
      :editor="page.editor"
      @select="page.selectPalette"
      @palette-resize="page.setPaletteSize"
      @surface-terrain="(terrain) => { page.selectSurfaceTerrain(terrain); page.setSurfaceTool('brush'); }"
      @surface-theme="page.setSurfaceTheme"
      @surface-pattern="page.setSurfacePattern"
      @surface-exact="page.setSurfaceExact"
      @surface-alternate-a="(type) => page.setSurfaceAlternate(0, type)"
      @surface-alternate-b="(type) => page.setSurfaceAlternate(1, type)"
      @hover="page.hover.value = $event"
      @primary-start="page.primaryStart"
      @primary-move="page.primaryMove"
      @primary-end="page.primaryEnd"
      @secondary-select="page.selectCell"
      @resize="page.resize"
      @field="page.updateField"
      @variant="page.applyVariant"
      @surface-variant="page.applySurfaceVariant"
      @delete-layer="page.deleteLayer"
      @reorder-layers="page.reorderLayers"
      @batch-field="page.updateBatchField"
      @batch-variant="page.applyBatchVariant"
      @batch-surface-variant="page.applyBatchSurfaceVariant"
      @batch-delete="page.deleteSelectedType"
      @placement-field="page.updatePlacementField"
      @placement-variant="page.applyPlacementVariant"
      @rule="page.setRule"
      @rule-mode="page.setRuleMode"
      @max-moves="page.setMaxMoves"
      @max-time="page.setMaxTimeSeconds"
      @metadata-field="page.setMetadataValue"
      @music="setMusic"
      @music-preview-toggle="toggleMusicPreview"
      @play-restart="restartPlay"
      @play-stop="exitPlayRoute"
    />
    <EditorFileDialog
      :open="page.fileDialogOpen.value"
      :level="page.snapshot.value.level"
      :name-value="page.nameValue.value"
      :author-value="page.authorValue.value"
      :note-value="page.noteValue.value"
      @close="page.fileDialogOpen.value = false"
      @import="importLevel"
      @metadata-field="page.setMetadataValue"
      @metadata-flush="page.flushMetadata"
      @saved="markDownloaded"
    />
  </div>
</template>
