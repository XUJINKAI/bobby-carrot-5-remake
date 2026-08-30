<script setup lang="ts">
import { type EditorLevel, type Cell } from "@bobby/editor";
import type { AudioBackend, ImageManager } from "@bobby/engine";
import type { GameSession } from "../../runtime/game/createGameSession.js";
import { createGameSession } from "../../runtime/game/createGameSession.js";
import { loadScreenControlPreference } from "../../shell/shellBridge.js";
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import EditorFileDialog from "./EditorFileDialog.vue";
import EditorWorkspace from "./EditorWorkspace.vue";
import { configureEditorShell } from "./editorShell.js";
import { useEditorPage } from "./useEditorPage.js";

const props = defineProps<{
  initialLevel: EditorLevel;
  audio: AudioBackend;
  images: ImageManager;
  navigate: (path: string) => void;
}>();
const page = useEditorPage(props.initialLevel);
let session: GameSession | null = null;
const paletteOpen = ref(false);
const inspectorOpen = ref(false);

async function togglePlay(): Promise<void> {
  if (page.playing.value) {
    stopPlay();
    return;
  }
  page.playing.value = true;
  configureEditorShell(true);
  await nextTick();
  const canvas = document.querySelector<HTMLCanvasElement>(
    "[data-editor-game-canvas]",
  );
  const root = document.querySelector<HTMLElement>(
    "[data-editor-game-dialog-root]",
  );
  if (!canvas || !root) throw new Error("Editor Play Test 舞台挂载失败");
  try {
    session = await createGameSession({
      root,
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
          screenJoystick: { enabled: loadScreenControlPreference() },
        },
      },
    });
  } catch (error) {
    page.playing.value = false;
    configureEditorShell(false);
    window.alert(error instanceof Error ? error.message : String(error));
  }
}

function stopPlay(): void {
  session?.destroy();
  session = null;
  page.playing.value = false;
  configureEditorShell(false);
}

function restartPlay(): void {
  session?.game.restart();
}

function importLevel(level: EditorLevel): void {
  page.document.load(level);
  page.fileDialogOpen.value = false;
}

function markDownloaded(metadata: {
  name: string;
  author?: string;
  description?: string;
}): void {
  page.updateMetadata(metadata);
  page.document.markSaved();
}

function handleKeydown(event: KeyboardEvent): void {
  if (page.playing.value || isTextInput(event.target)) return;
  const modifier = event.ctrlKey || event.metaKey;
  if (modifier && event.key.toLowerCase() === "z") {
    event.preventDefault();
    event.shiftKey ? page.document.redo() : page.document.undo();
  } else if (modifier && event.key.toLowerCase() === "y") {
    event.preventDefault();
    page.document.redo();
  } else if (
    (event.key === "Delete" || event.key === "Backspace") &&
    page.hover.value
  ) {
    event.preventDefault();
    page.stroke(page.hover.value, 2);
  } else if (
    (event.key.toLowerCase() === "q" || event.key.toLowerCase() === "e") &&
    page.hover.value
  ) {
    event.preventDefault();
    page.transform(
      page.hover.value,
      event.key.toLowerCase() === "q" ? -1 : 1,
    );
  }
}

function onShellAction(event: Event): void {
  const action = (event as CustomEvent<{ action: string }>).detail.action;
  if (action === "editor-undo") page.document.undo();
  if (action === "editor-redo") page.document.redo();
  if (action === "editor-play") void togglePlay();
  if (action === "editor-restart") restartPlay();
  if (action === "editor-share") page.fileDialogOpen.value = true;
  if (action === "editor-palette") paletteOpen.value = !paletteOpen.value;
  if (action === "editor-inspector") inspectorOpen.value = !inspectorOpen.value;
  if (action === "editor-level-info") page.fileDialogOpen.value = true;
}

function onShellDialogOpen(): void {
  session?.input.setEnabled(false);
}

function onShellDialogClose(): void {
  session?.input.setEnabled(true);
}

function onScreenControlChange(event: Event): void {
  const enabled = Boolean(
    (event as CustomEvent<{ enabled: boolean }>).detail.enabled,
  );
  session?.input.setScreenJoystickEnabled(enabled);
}

function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (!page.snapshot.value.dirty) return;
  event.preventDefault();
}

function transform(
  cell: Cell,
  step: number,
  result: (changed: boolean) => void,
): void {
  result(page.transform(cell, step));
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("game-shell-action", onShellAction);
  window.addEventListener("shell-dialog-open", onShellDialogOpen);
  window.addEventListener("shell-dialog-close", onShellDialogClose);
  window.addEventListener("screen-control-change", onScreenControlChange);
  window.addEventListener("beforeunload", onBeforeUnload);
});
onBeforeUnmount(() => {
  stopPlay();
  window.removeEventListener("keydown", handleKeydown);
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
</script>

<template>
  <div
    class="bobby-editor"
    :class="{
      'palette-sheet-open': paletteOpen,
      'inspector-sheet-open': inspectorOpen,
    }"
  >
    <EditorWorkspace
      :level="page.snapshot.value.level as EditorLevel"
      :revision="page.snapshot.value.revision"
      :placement-sequence="page.snapshot.value.placementSequence"
      :selection="page.selection.value"
      :hover="page.hover.value"
      :inspector="page.inspector.value"
      :palette-size="page.paletteSize.value"
      :playing="page.playing.value"
      :images="props.images"
      @select="page.selection.value = $event"
      @palette-resize="page.setPaletteSize"
      @hover="page.hover.value = $event"
      @stroke="page.stroke"
      @begin-stroke="page.document.beginTransaction()"
      @end-stroke="page.document.commitTransaction()"
      @transform="transform"
      @resize="page.resize"
      @property="(entityIndex, key, value) => page.updateProperty(entityIndex, key, value)"
      @max-moves="page.setMaxMoves"
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
