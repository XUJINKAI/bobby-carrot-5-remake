<script setup lang="ts">
import {
  EDITOR_TILE_SIZE,
  EditorCanvasInput,
  EditorCanvasRenderer,
  EditorViewport,
  previewEditorResize,
  type Cell,
  type EditorCanvasContextMenuRequest,
  type EditorMap,
  type EditorPlacementPreset,
  type EditorResizeEdges,
  type EditorResizeResult,
  type EditorSelection,
  type EditorTool,
  type EntityCatalog,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  level: Readonly<EditorMap>;
  revision: number;
  tool: EditorTool;
  placement: EditorPlacementPreset | null;
  selection: EditorSelection | null;
  hover: Cell | null;
  enabled: boolean;
  images: ImageManager;
  catalog: EntityCatalog;
}>();
const emit = defineEmits<{
  hover: [cell: Cell | null];
  primaryStart: [cell: Cell];
  primaryMove: [cell: Cell];
  primaryEnd: [cell: Cell | null];
  contextMenu: [request: EditorCanvasContextMenuRequest];
  transform: [cell: Cell, step: number, result: (changed: boolean) => void];
  resize: [edges: EditorResizeEdges];
}>();
const stage = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const resizePreview = ref<EditorResizeResult | null>(null);
const viewport = new EditorViewport();
let renderer: EditorCanvasRenderer | null = null;
let input: EditorCanvasInput | null = null;
let resizeDrag: null | {
  pointerId: number;
  corner: "nw" | "ne" | "sw" | "se";
  startX: number;
  startY: number;
} = null;

function render(): void {
  const view = viewport.snapshot;
  if (stage.value) {
    stage.value.style.width = `${props.level.width * EDITOR_TILE_SIZE}px`;
    stage.value.style.height = `${props.level.height * EDITOR_TILE_SIZE}px`;
    stage.value.style.transform = `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`;
  }
  renderer?.render({
    level: props.level as EditorMap,
    tool: props.tool,
    placement: props.placement,
    selection: props.selection,
    hover: props.hover,
    viewport: view,
  });
}

function previewStyle(): Record<string, string> {
  const edges = resizePreview.value?.edges;
  if (!edges) return {};
  return {
    left: `${-edges.left * EDITOR_TILE_SIZE}px`,
    top: `${-edges.top * EDITOR_TILE_SIZE}px`,
    width: `${(props.level.width + edges.left + edges.right) * EDITOR_TILE_SIZE}px`,
    height: `${(props.level.height + edges.top + edges.bottom) * EDITOR_TILE_SIZE}px`,
  };
}

function startResize(corner: "nw" | "ne" | "sw" | "se", event: PointerEvent): void {
  if (!props.enabled) return;
  event.preventDefault();
  event.stopPropagation();
  resizeDrag = {
    pointerId: event.pointerId,
    corner,
    startX: event.clientX,
    startY: event.clientY,
  };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function moveResize(event: PointerEvent): void {
  const drag = resizeDrag;
  if (!drag || drag.pointerId !== event.pointerId) return;
  event.preventDefault();
  event.stopPropagation();
  const scale = EDITOR_TILE_SIZE * viewport.snapshot.zoom;
  const dx = Math.round((event.clientX - drag.startX) / scale);
  const dy = Math.round((event.clientY - drag.startY) / scale);
  const request: EditorResizeEdges = { left: 0, right: 0, top: 0, bottom: 0 };
  if (drag.corner.includes("w")) request.left = -dx;
  else request.right = dx;
  if (drag.corner.includes("n")) request.top = -dy;
  else request.bottom = dy;
  resizePreview.value = previewEditorResize(
    props.level as EditorMap,
    props.catalog,
    request,
  );
}

function endResize(event: PointerEvent): void {
  if (!resizeDrag || resizeDrag.pointerId !== event.pointerId) return;
  event.preventDefault();
  event.stopPropagation();
  const result = resizePreview.value;
  resizeDrag = null;
  resizePreview.value = null;
  if (!result) return;
  if (Object.values(result.edges).some((value) => value !== 0))
    emit("resize", result.edges);
}

function fitInitialViewport(): void {
  const shell = stage.value?.parentElement;
  if (!shell) return;
  const style = getComputedStyle(shell);
  const padding = Math.max(
    Number.parseFloat(style.paddingLeft) || 0,
    Number.parseFloat(style.paddingTop) || 0,
  );
  viewport.fitInitial(
    shell.clientWidth,
    shell.clientHeight,
    props.level.width * EDITOR_TILE_SIZE,
    props.level.height * EDITOR_TILE_SIZE,
    padding,
  );
  render();
}

watch(
  () => [props.revision, props.tool, props.placement, props.selection, props.hover, props.enabled],
  () => {
    input?.setEnabled(props.enabled);
    render();
  },
  { deep: true },
);

onMounted(async () => {
  if (!canvas.value) return;
  renderer = new EditorCanvasRenderer(canvas.value, props.images, props.catalog);
  input = new EditorCanvasInput(canvas.value, viewport, {
    dimensions: () => ({ width: props.level.width, height: props.level.height }),
    hover: (cell) => emit("hover", cell),
    primaryStart: (cell) => emit("primaryStart", cell),
    primaryMove: (cell) => emit("primaryMove", cell),
    primaryEnd: (cell) => emit("primaryEnd", cell),
    contextMenu: (request) => emit("contextMenu", request),
    transform: (cell, step) => {
      let changed = false;
      emit("transform", cell, step, (result) => { changed = result; });
      return changed;
    },
    viewportChanged: render,
  });
  await renderer.load();
  await nextTick();
  requestAnimationFrame(fitInitialViewport);
});

onBeforeUnmount(() => input?.destroy());
</script>

<template>
  <div ref="stage" class="editor-canvas-stage">
    <canvas ref="canvas" class="editor-canvas" aria-label="地图编辑画布" />
    <div
      v-if="resizePreview"
      class="editor-resize-preview"
      :class="{ warning: resizePreview.removedCount > 0 }"
      :style="previewStyle()"
    >
      <span class="editor-resize-label">
        {{ resizePreview.map.width }} × {{ resizePreview.map.height }}
        <template v-if="resizePreview.removedCount > 0"> · 将删除 {{ resizePreview.removedCount }} 个对象</template>
      </span>
    </div>
    <button class="editor-resize-handle nw" type="button" title="调整左上边界" @pointerdown="startResize('nw', $event)" @pointermove="moveResize" @pointerup="endResize" @pointercancel="endResize" />
    <button class="editor-resize-handle ne" type="button" title="调整右上边界" @pointerdown="startResize('ne', $event)" @pointermove="moveResize" @pointerup="endResize" @pointercancel="endResize" />
    <button class="editor-resize-handle sw" type="button" title="调整左下边界" @pointerdown="startResize('sw', $event)" @pointermove="moveResize" @pointerup="endResize" @pointercancel="endResize" />
    <button class="editor-resize-handle se" type="button" title="调整右下边界" @pointerdown="startResize('se', $event)" @pointermove="moveResize" @pointerup="endResize" @pointercancel="endResize" />
  </div>
</template>

<style scoped>
.editor-canvas-stage {
  position: relative;
  transform-origin: 0 0;
}
.editor-resize-handle {
  position: absolute;
  z-index: 6;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 2px solid #d9f3ff;
  border-radius: 50%;
  background: #168bc2;
  box-shadow: 0 2px 7px #0008;
  touch-action: none;
}
.editor-resize-handle:hover { background:#38b5df; }
.editor-resize-handle.nw { left:0; top:0; transform:translate(-50%,-50%); cursor:nwse-resize; }
.editor-resize-handle.ne { right:0; top:0; transform:translate(50%,-50%); cursor:nesw-resize; }
.editor-resize-handle.sw { left:0; bottom:0; transform:translate(-50%,50%); cursor:nesw-resize; }
.editor-resize-handle.se { right:0; bottom:0; transform:translate(50%,50%); cursor:nwse-resize; }
.editor-resize-preview {
  position:absolute;
  z-index:5;
  pointer-events:none;
  border:2px dashed #72cff3;
  background:rgba(78,181,224,.12);
}
.editor-resize-preview.warning {
  border-color:#ff8e8e;
  background:rgba(255,90,90,.12);
}
.editor-resize-label {
  position:absolute;
  left:8px;
  top:8px;
  padding:4px 7px;
  border-radius:5px;
  background:#082f59e8;
  color:#fff;
  font-size:11px;
  white-space:nowrap;
}
</style>
