<script setup lang="ts">
import { type EditorLevel, type Cell } from "@bobby/editor";
import type { GameSession } from "../../runtime/game/createGameSession.js";
import { createGameSession } from "../../runtime/game/createGameSession.js";
import type { TinySynthAudioBackend } from "../../services/audio/TinySynthAudio.js";
import { siteUrl } from "../../services/assets/gameAssets.js";
import { loadScreenControlPreference } from "../../shell/shellBridge.js";
import { nextTick, onBeforeUnmount, onMounted } from "vue";
import { downloadEditorFile, readEditorFile } from "./editorFiles.js";
import EditorFileDialog from "./EditorFileDialog.vue";
import EditorWorkspace from "./EditorWorkspace.vue";
import { useEditorPage } from "./useEditorPage.js";

const props = defineProps<{
  initialLevel: EditorLevel;
  audio: TinySynthAudioBackend;
  navigate: (path: string) => void;
}>();
const page = useEditorPage(props.initialLevel);
const atlasUrl = siteUrl("assets/art/hd/ts.png");
let session: GameSession | null = null;

async function togglePlay(): Promise<void> {
  if (page.playing.value) {
    stopPlay();
    return;
  }
  page.playing.value = true;
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
        assets: {
          atlasUrl,
          animationAtlasUrl: siteUrl("assets/art/hd/ta.png"),
          bobbyUrls: {
            left: siteUrl("assets/art/hd/b0.png"),
            right: siteUrl("assets/art/hd/b1.png"),
            up: siteUrl("assets/art/hd/b2.png"),
            down: siteUrl("assets/art/hd/b3.png"),
          },
          mowerBobbyUrl: siteUrl("assets/art/hd/b7.png"),
          kiteUrl: siteUrl("assets/art/hd/b9.png"),
          sourceTileSize: 48,
        },
        audio: props.audio,
        debug: false,
      },
      runtime: {
        hud: {
          hudAtlasUrl: siteUrl("assets/art/hd/hud.png"),
          goldenCarrotUrl: siteUrl("assets/art/hd/icon.png"),
        },
        input: {
          screenJoystick: { enabled: loadScreenControlPreference() },
        },
      },
    });
  } catch (error) {
    page.playing.value = false;
    window.alert(error instanceof Error ? error.message : String(error));
  }
}

function stopPlay(): void {
  session?.destroy();
  session = null;
  page.playing.value = false;
}

async function importFile(file: File): Promise<void> {
  try {
    page.document.load(await readEditorFile(file));
    page.fileDialogOpen.value = false;
  } catch (error) {
    window.alert(error instanceof Error ? error.message : String(error));
  }
}

function exportFile(metadata: {
  name: string;
  author?: string;
  description?: string;
}): void {
  page.updateMetadata(metadata);
  downloadEditorFile(page.snapshot.value.level as EditorLevel);
  page.document.markSaved();
  page.fileDialogOpen.value = false;
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
  } else if ((event.key === "Delete" || event.key === "Backspace") && page.hover.value) {
    event.preventDefault();
    page.stroke(page.hover.value, 2);
  } else if ((event.key.toLowerCase() === "q" || event.key.toLowerCase() === "e") && page.hover.value) {
    event.preventDefault();
    page.transform(page.hover.value, event.key.toLowerCase() === "q" ? -1 : 1);
  }
}

function onShellAction(event: Event): void {
  const action = (event as CustomEvent<{ action: string }>).detail.action;
  if (action === "editor-undo") page.document.undo();
  if (action === "editor-redo") page.document.redo();
  if (action === "editor-play") void togglePlay();
  if (action === "editor-file") page.fileDialogOpen.value = true;
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

function transform(cell: Cell, step: number, result: (changed: boolean) => void): void {
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
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}
</script>

<template>
  <div class="bobby-editor">
    <EditorWorkspace
      :level="page.snapshot.value.level as EditorLevel"
      :revision="page.snapshot.value.revision"
      :selection="page.selection.value"
      :hover="page.hover.value"
      :inspector="page.inspector.value"
      :palette-size="page.paletteSize.value"
      :playing="page.playing.value"
      :atlas-url="atlasUrl"
      @select="page.selection.value = $event"
      @palette-resize="page.setPaletteSize"
      @hover="page.hover.value = $event"
      @stroke="page.stroke"
      @begin-stroke="page.document.beginTransaction()"
      @end-stroke="page.document.commitTransaction()"
      @transform="transform"
      @resize="page.resize"
      @property="(x, y, key, value) => page.updateProperty({ x, y }, key, value)"
      @trait="(x, y, trait, enabled) => page.updateTrait({ x, y }, trait, enabled)"
      @max-moves="page.setMaxMoves"
    />
    <EditorFileDialog
      :open="page.fileDialogOpen.value"
      :level="page.snapshot.value.level"
      @close="page.fileDialogOpen.value = false"
      @import="importFile"
      @export="exportFile"
    />
  </div>
</template>
