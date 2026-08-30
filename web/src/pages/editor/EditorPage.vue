<script setup lang="ts">
import {
  validateEditorLevel,
  type Cell,
  type EditorCanvasContextMenuRequest,
  type EditorMap,
} from "@bobby/editor";
import type { AudioBackend, ImageManager } from "@bobby/engine";
import type { GameSession } from "../../runtime/game/createGameSession.js";
import { createGameSession } from "../../runtime/game/createGameSession.js";
import { loadScreenControlPreference } from "../../shell/shellBridge.js";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
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
let session: GameSession | null = null;
const paletteOpen = ref(true);
const rightPanel = ref<"inspector" | "level" | null>("inspector");
const contextMenu = ref<null | { x: number; y: number; cell: Cell }>(null);
const issues = computed(() => validateEditorLevel(page.snapshot.value.level as EditorMap, page.catalog));

function syncShell(): void {
  configureEditorShell(page.playing.value, page.tool.value, issues.value);
}
watch(
  () => [page.playing.value, page.tool.value, issues.value.map((issue) => `${issue.level}:${issue.message}`).join("|")],
  syncShell,
);

async function togglePlay(): Promise<void> {
  closeContextMenu();
  if (page.playing.value) { stopPlay(); return; }
  page.playing.value = true;
  syncShell();
  await nextTick();
  const canvas = document.querySelector<HTMLCanvasElement>("[data-editor-game-canvas]");
  const root = document.querySelector<HTMLElement>("[data-editor-game-dialog-root]");
  if (!canvas || !root) throw new Error("Editor Play Test 舞台挂载失败");
  try {
    session = await createGameSession({
      root, canvas, level: page.levelMap.value,
      gameOptions: { images: props.images, audio: props.audio, debug: false },
      runtime: { hud: true, input: { screenJoystick: { enabled: loadScreenControlPreference() } } },
    });
  } catch (error) {
    page.playing.value = false;
    syncShell();
    window.alert(error instanceof Error ? error.message : String(error));
  }
}
function stopPlay(): void {
  session?.destroy();
  session = null;
  page.playing.value = false;
  syncShell();
}
function restartPlay(): void { session?.game.restart(); }
function importLevel(level: EditorMap): void { page.document.load(level); page.fileDialogOpen.value = false; }
function markDownloaded(metadata: { name: string; author?: string; description?: string }): void { page.updateMetadata(metadata); page.document.markSaved(); }

function openContextMenu(request: EditorCanvasContextMenuRequest): void {
  page.ensureSelectionAt(request.cell);
  contextMenu.value = { x: request.clientX, y: request.clientY, cell: request.cell };
}
function closeContextMenu(): void { contextMenu.value = null; }
function pasteFromMenu(): void { const cell = contextMenu.value?.cell; if (cell) page.paste(cell); }
function transform(cell: Cell, step: number, result: (changed: boolean) => void): void { result(page.transform(cell, step)); }

function handleKeydown(event: KeyboardEvent): void {
  if (page.playing.value || isTextInput(event.target)) return;
  const modifier = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  if (event.key === "Escape") { closeContextMenu(); return; }
  if (modifier && key === "z") { event.preventDefault(); event.shiftKey ? page.document.redo() : page.document.undo(); }
  else if (modifier && key === "y") { event.preventDefault(); page.document.redo(); }
  else if (modifier && key === "c") { event.preventDefault(); page.copy(); }
  else if (modifier && key === "x") { event.preventDefault(); page.cut(); }
  else if (modifier && key === "v") { event.preventDefault(); const origin = page.hover.value ?? page.mapSelection.value?.anchor; if (origin) page.paste(origin); }
  else if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); page.deleteSelection(); }
  else if (key === "1") { event.preventDefault(); page.setTool("select"); }
  else if (key === "2") { event.preventDefault(); page.setTool("place"); }
  else if (key === "3") { event.preventDefault(); page.setTool("erase"); }
  else if ((key === "q" || key === "e") && page.hover.value) { event.preventDefault(); page.transform(page.hover.value, key === "q" ? -1 : 1); }
}

function onShellAction(event: Event): void {
  const action = (event as CustomEvent<{ action: string }>).detail.action;
  if (action === "editor-tool-select") page.setTool("select");
  if (action === "editor-tool-place") page.setTool("place");
  if (action === "editor-tool-erase") page.setTool("erase");
  if (action === "editor-undo") page.document.undo();
  if (action === "editor-redo") page.document.redo();
  if (action === "editor-play") void togglePlay();
  if (action === "editor-restart") restartPlay();
  if (action === "editor-share") page.fileDialogOpen.value = true;
  if (action === "editor-palette") togglePanel("palette");
  if (action === "editor-inspector") togglePanel("inspector");
  if (action === "editor-level-info") togglePanel("level");
}

function togglePanel(panel: "palette" | "inspector" | "level"): void {
  if (isMobileEditor()) {
    if (panel === "palette") {
      const opening = !paletteOpen.value;
      paletteOpen.value = opening;
      rightPanel.value = null;
      return;
    }
    const opening = rightPanel.value !== panel;
    paletteOpen.value = false;
    rightPanel.value = opening ? panel : null;
    return;
  }
  if (panel === "palette") paletteOpen.value = !paletteOpen.value;
  else rightPanel.value = rightPanel.value === panel ? null : panel;
}

function onShellDialogOpen(): void { session?.input.setEnabled(false); }
function onShellDialogClose(): void { session?.input.setEnabled(true); }
function onScreenControlChange(event: Event): void { session?.input.setScreenJoystickEnabled(Boolean((event as CustomEvent<{ enabled: boolean }>).detail.enabled)); }
function onBeforeUnload(event: BeforeUnloadEvent): void { if (page.snapshot.value.dirty) event.preventDefault(); }

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
function isTextInput(target: EventTarget | null): boolean { return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement; }
function isMobileEditor(): boolean { return window.matchMedia("(max-width: 620px)").matches; }
</script>

<template>
  <div class="bobby-editor" :class="{ 'palette-sheet-open': paletteOpen, 'inspector-sheet-open': rightPanel !== null }">
    <EditorWorkspace
      :level="page.snapshot.value.level as EditorMap"
      :revision="page.snapshot.value.revision"
      :tool="page.tool.value"
      :placement="page.placement.value"
      :selection="page.mapSelection.value"
      :hover="page.hover.value"
      :inspector="page.inspector.value"
      :palette="page.palette"
      :palette-size="page.paletteSize.value"
      :palette-open="paletteOpen"
      :right-panel="rightPanel"
      :issues="issues"
      :playing="page.playing.value"
      :images="props.images"
      :catalog="page.catalog"
      @select="page.selectPalette"
      @palette-resize="page.setPaletteSize"
      @hover="page.hover.value = $event"
      @primary-start="(cell) => { closeContextMenu(); page.primaryStart(cell); }"
      @primary-move="page.primaryMove"
      @primary-end="page.primaryEnd"
      @context-menu="openContextMenu"
      @transform="transform"
      @resize="page.resize"
      @property="page.updateProperty"
      @state="page.updateState"
      @direction="page.setDirection"
      @variant="page.applyVariant"
      @max-moves="page.setMaxMoves"
      @max-time="page.setMaxTimeSeconds"
      @metadata="page.updateMetadata"
      @win="page.setWin"
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
