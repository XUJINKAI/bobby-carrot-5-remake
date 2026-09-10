<script setup lang="ts">
import {
  validateEditorLevel,
  type Cell,
  type EditorCanvasContextMenuRequest,
  type EditorMap,
  type LevelValidationIssue,
} from "@bobby/editor";
import type { AudioBackend, ImageManager } from "@bobby/engine";
import type { GameSession } from "../../runtime/game/createGameSession.js";
import { createGameSession } from "../../runtime/game/createGameSession.js";
import { getWebSettings } from "../../storage/settingsStorage.js";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import EditorContextMenu from "./EditorContextMenu.vue";
import EditorFileDialog from "./EditorFileDialog.vue";
import EditorWorkspace from "./EditorWorkspace.vue";
import { configureEditorShell } from "./editorShell.js";
import { useEditorPage } from "./useEditorPage.js";

const props = defineProps<{
  initialLevel: EditorMap;
  audio: AudioBackend;
  images: ImageManager;
  navigate: (path: string) => void;
}>();
const page = useEditorPage(props.initialLevel);
page.surfaceTool.value = "rect";
let session: GameSession | null = null;
let disposePlayChange = (): void => {};
const startsMobile = window.matchMedia("(max-width: 620px)").matches;
const leftOpen = ref(true);
const rightPanel = ref<"inspector" | "level" | null>(
  startsMobile ? null : "inspector",
);
const contextMenu = ref<null | { x: number; y: number; cell: Cell }>(null);
const playComplete = ref(false);
const runtimeIssue = ref<LevelValidationIssue | null>(null);
const issues = computed(() =>
  validateEditorLevel(
    page.snapshot.value.level as EditorMap,
    page.catalog,
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
    },
    page.leftPanel.value,
    page.surfaceTool.value,
  );
}
watch(
  () => [
    page.playing.value,
    page.tool.value,
    page.leftPanel.value,
    page.surfaceTool.value,
    shellIssues.value.map((issue) => `${issue.level}:${issue.message}`).join("|"),
  ],
  syncShell,
);

async function togglePlay(): Promise<void> {
  closeContextMenu();
  if (page.playing.value) {
    stopPlay();
    return;
  }
  runtimeIssue.value = null;
  playComplete.value = false;
  page.playing.value = true;
  syncShell();
  await nextTick();
  try {
    const canvas = document.querySelector<HTMLCanvasElement>(
      "[data-editor-game-canvas]",
    );
    if (!canvas) throw new Error("Editor Play Test 舞台挂载失败");
    session = await createGameSession({
      canvas,
      level: page.levelMap.value,
      gameOptions: {
        images: props.images,
        audio: props.audio,
        debug: false,
      },
      runtime: {
        hud: true,
        input: {
          screenJoystick: {
            enabled: getWebSettings().controls.screenControlEnabled,
          },
        },
      },
    });
    bindPlaySession();
  } catch (error) {
    runtimeIssue.value = {
      level: "error",
      message: `Play Test：${error instanceof Error ? error.message : String(error)}`,
    };
    syncShell();
  }
}

function bindPlaySession(): void {
  disposePlayChange();
  disposePlayChange = session?.game.on("change", syncPlayState) ?? (() => {});
  syncPlayState();
}
function syncPlayState(): void {
  if (!session) return;
  const won = session.game.state.status === "won";
  const wasComplete = playComplete.value;
  playComplete.value = won;
  if (won) session.input.setEnabled(false);
  else if (wasComplete) session.input.setEnabled(true);
  syncShell();
}
function stopPlay(): void {
  disposePlayChange();
  disposePlayChange = (): void => {};
  playComplete.value = false;
  session?.destroy();
  session = null;
  page.playing.value = false;
  syncShell();
}
function restartPlay(): void {
  if (!session) return;
  playComplete.value = false;
  session.input.setEnabled(true);
  session.game.restart();
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
function markDownloaded(metadata: {
  name: string;
  author?: string;
  note?: string;
}): void {
  page.updateMetadata(metadata);
  page.document.markSaved();
}

function openContextMenu(request: EditorCanvasContextMenuRequest): void {
  if (page.leftPanel.value === "surface") {
    page.pickSurface(request.cell);
    closeContextMenu();
    return;
  }
  page.ensureSelectionAt(request.cell);
  contextMenu.value = {
    x: request.clientX,
    y: request.clientY,
    cell: request.cell,
  };
}
function closeContextMenu(): void {
  contextMenu.value = null;
}
function pasteFromMenu(): void {
  const cell = contextMenu.value?.cell;
  if (cell) page.paste(cell);
}
function selectAll(): void {
  const level = page.snapshot.value.level as EditorMap;
  page.mapSelection.value = {
    anchor: { x: 0, y: 0 },
    focus: { x: level.width - 1, y: level.height - 1 },
  };
  closeContextMenu();
}

function switchAuthoringPanel(): void {
  page.toggleAuthoringPanel();
  leftOpen.value = true;
  if (isMobileEditor()) rightPanel.value = null;
  closeContextMenu();
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
  if (event.key === "Escape") {
    closeContextMenu();
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

function onShellDialogOpen(): void {
  session?.input.setEnabled(false);
}
function onShellDialogClose(): void {
  if (!playComplete.value) session?.input.setEnabled(true);
}
function onScreenControlChange(event: Event): void {
  session?.input.setScreenJoystickEnabled(
    Boolean((event as CustomEvent<{ enabled: boolean }>).detail.enabled),
  );
}
function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (page.snapshot.value.dirty) event.preventDefault();
}

onMounted(() => {
  syncShell();
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("pointerdown", closeContextMenu);
  window.addEventListener("game-shell-action", onShellAction);
  window.addEventListener("shell-dialog-open", onShellDialogOpen);
  window.addEventListener("shell-dialog-close", onShellDialogClose);
  window.addEventListener("screen-control-change", onScreenControlChange);
  window.addEventListener("beforeunload", onBeforeUnload);
});
onBeforeUnmount(() => {
  stopPlay();
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("pointerdown", closeContextMenu);
  window.removeEventListener("game-shell-action", onShellAction);
  window.removeEventListener("shell-dialog-open", onShellDialogOpen);
  window.removeEventListener("shell-dialog-close", onShellDialogClose);
  window.removeEventListener("screen-control-change", onScreenControlChange);
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
    class="bobby-editor"
    :class="{
      'palette-sheet-open': leftOpen,
      'inspector-sheet-open': rightPanel !== null,
    }"
  >
    <EditorWorkspace
      :level="page.snapshot.value.level as EditorMap"
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
      :palette="page.palette"
      :palette-size="page.paletteSize.value"
      :left-open="leftOpen"
      :right-panel="rightPanel"
      :playing="page.playing.value"
      :play-complete="playComplete"
      :images="props.images"
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
      @primary-start="(cell) => { closeContextMenu(); page.primaryStart(cell); }"
      @primary-move="page.primaryMove"
      @primary-end="page.primaryEnd"
      @context-menu="openContextMenu"
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
      @max-moves="page.setMaxMoves"
      @max-time="page.setMaxTimeSeconds"
      @metadata="page.updateMetadata"
      @play-restart="restartPlay"
      @play-stop="stopPlay"
    />
    <EditorContextMenu
      :open="Boolean(contextMenu)"
      :x="contextMenu?.x ?? 0"
      :y="contextMenu?.y ?? 0"
      :can-paste="Boolean(page.clipboard.value?.entities.length)"
      :entity-selected="page.selectedRefs.value.length > 0"
      @close="closeContextMenu"
      @copy="page.copy"
      @cut="page.cut"
      @paste="pasteFromMenu"
      @delete="page.deleteSelection"
    />
    <EditorFileDialog
      :open="page.fileDialogOpen.value"
      :level="page.snapshot.value.level"
      @close="page.fileDialogOpen.value = false"
      @import="importLevel"
      @saved="markDownloaded"
    />
  </div>
</template>
