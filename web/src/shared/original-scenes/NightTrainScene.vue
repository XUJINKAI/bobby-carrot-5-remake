<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { siteUrl } from "../../services/assets/gameAssets.js";
import { ORIGINAL_SCENE_ASSETS } from "./originalSceneSprites.js";

interface TrainBand {
  from: number;
  to: number;
  speed: number;
}

const canvas = ref<HTMLCanvasElement | null>(null);
const trainUrl = siteUrl(ORIGINAL_SCENE_ASSETS.train);
const bands: readonly TrainBand[] = [
  { from: 0, to: 0.43, speed: 5 },
  { from: 0.43, to: 0.64, speed: 12 },
  { from: 0.64, to: 0.82, speed: 25 },
  { from: 0.82, to: 1, speed: 0 },
];
let image: HTMLImageElement | null = null;
let animationFrame = 0;
let startedAt = 0;
let reducedMotion = false;

function drawWrappedBand(
  context: CanvasRenderingContext2D,
  source: HTMLImageElement,
  band: TrainBand,
  width: number,
  height: number,
  elapsedSeconds: number,
): void {
  const sourceY = source.naturalHeight * band.from;
  const sourceHeight = source.naturalHeight * (band.to - band.from);
  const targetY = height * band.from;
  const targetHeight = height * (band.to - band.from);
  if (band.speed === 0 || reducedMotion) {
    context.drawImage(
      source,
      0,
      sourceY,
      source.naturalWidth,
      sourceHeight,
      0,
      targetY,
      width,
      targetHeight,
    );
    return;
  }
  const offset = -((elapsedSeconds * band.speed) % width);
  for (let x = offset - width; x < width; x += width) {
    context.drawImage(
      source,
      0,
      sourceY,
      source.naturalWidth,
      sourceHeight,
      x,
      targetY,
      width,
      targetHeight,
    );
  }
}

function draw(now: number): void {
  if (!canvas.value || !image) return;
  const bounds = canvas.value.getBoundingClientRect();
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.value.width !== pixelWidth || canvas.value.height !== pixelHeight) {
    canvas.value.width = pixelWidth;
    canvas.value.height = pixelHeight;
  }
  const context = canvas.value.getContext("2d");
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = false;
  const elapsedSeconds = startedAt === 0 ? 0 : (now - startedAt) / 1000;
  if (startedAt === 0) startedAt = now;
  for (const band of bands)
    drawWrappedBand(context, image, band, width, height, elapsedSeconds);
  animationFrame = requestAnimationFrame(draw);
}

onMounted(() => {
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const next = new Image();
  next.decoding = "async";
  next.onload = () => {
    image = next;
    animationFrame = requestAnimationFrame(draw);
  };
  next.onerror = () => console.warn(`无法加载原版场景资源：${trainUrl}`);
  next.src = trainUrl;
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame);
  image = null;
});
</script>

<template>
  <div class="night-train-scene" aria-hidden="true">
    <canvas ref="canvas" />
  </div>
</template>

<style scoped>
.night-train-scene {
  position: relative;
  overflow: hidden;
  aspect-ratio: 768 / 204;
  background: #123578;
}

.night-train-scene canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}
</style>
