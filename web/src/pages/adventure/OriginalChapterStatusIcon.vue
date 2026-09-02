<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { spriteFrameRect } from "../../shared/original-scenes/originalSceneSprites.js";

const props = defineProps<{ images: ImageManager; completed: boolean }>();
const canvas = ref<HTMLCanvasElement | null>(null);
let image: HTMLImageElement | null = null;
const CHAPTER_STATUS_FRAMES = {
    pending: { x: 0, y: 0, width: 18, height: 18 },
    completed: { x: 18, y: 0, width: 31, height: 18 },
  } as const;

function draw(): void {
  if (!image || !canvas.value) return;
  const target = canvas.value;
  const context = target.getContext("2d");
  if (!context) return;
  const horizontal = image.naturalWidth >= image.naturalHeight;
  const frame = props.completed
    ? CHAPTER_STATUS_FRAMES.completed
    : CHAPTER_STATUS_FRAMES.pending;
  target.width = Math.round(frame.width);
  target.height = Math.round(frame.height);
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, target.width, target.height);
  context.drawImage(
    image,
    frame.x,
    frame.y,
    frame.width,
    frame.height,
    0,
    0,
    target.width,
    target.height,
  );
}

onMounted(async () => {
  image = await props.images.load("original-misc");
  draw();
});
watch(() => props.completed, draw);
onBeforeUnmount(() => {
  image = null;
});
</script>

<template><canvas ref="canvas" class="chapter-status-icon" aria-hidden="true" /></template>

<style scoped>
.chapter-status-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  image-rendering: pixelated;
}
</style>
