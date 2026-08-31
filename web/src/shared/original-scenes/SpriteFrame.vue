<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { spriteFrameRect } from "./originalSceneSprites.js";

const props = withDefaults(
  defineProps<{
    src: string;
    columns?: number;
    rows?: number;
    frame?: number;
  }>(),
  {
    columns: 1,
    rows: 1,
    frame: 0,
  },
);

const canvas = ref<HTMLCanvasElement | null>(null);
let image: HTMLImageElement | null = null;
let loadToken = 0;

function load(): void {
  const token = ++loadToken;
  const next = new Image();
  next.decoding = "async";
  next.onload = () => {
    if (token !== loadToken) return;
    image = next;
    draw();
  };
  next.src = props.src;
}

function draw(): void {
  if (!canvas.value || !image) return;
  const rect = spriteFrameRect(
    image.naturalWidth,
    image.naturalHeight,
    props.columns,
    props.rows,
    props.frame,
  );
  canvas.value.width = Math.round(rect.width);
  canvas.value.height = Math.round(rect.height);
  const context = canvas.value.getContext("2d");
  if (!context) return;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, canvas.value.width, canvas.value.height);
  context.drawImage(
    image,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height,
  );
}

onMounted(load);
onBeforeUnmount(() => {
  loadToken += 1;
  image = null;
});
watch(() => props.src, load);
watch(() => [props.columns, props.rows, props.frame], draw);
</script>

<template>
  <canvas ref="canvas" class="sprite-frame" aria-hidden="true" />
</template>

<style scoped>
.sprite-frame {
  display: block;
  width: 100%;
  height: auto;
  image-rendering: pixelated;
}
</style>
