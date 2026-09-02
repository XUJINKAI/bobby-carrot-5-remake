<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{ images: ImageManager; completed: boolean }>();
const canvas = ref<HTMLCanvasElement | null>(null);
let image: HTMLImageElement | null = null;

function draw(): void {
  if (!image || !canvas.value) return;
  const target = canvas.value;
  const context = target.getContext("2d");
  if (!context) return;
  const frameHeight = image.naturalHeight / 9;
  target.width = image.naturalWidth;
  target.height = frameHeight;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, target.width, target.height);
  context.drawImage(
    image,
    0,
    props.completed ? frameHeight : 0,
    image.naturalWidth,
    frameHeight,
    0,
    0,
    image.naturalWidth,
    frameHeight,
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
  width: 34px;
  height: 34px;
  object-fit: contain;
  image-rendering: pixelated;
}
</style>
