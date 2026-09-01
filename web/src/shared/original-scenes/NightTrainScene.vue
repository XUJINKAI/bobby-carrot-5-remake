<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

interface TrainLayer {
  from: number;
  to: number;
  speed: number;
  /** 以所有图层共同下边沿为 0；正值向上偏移，单位为原图像素。 */
  offsetY: number;
  zIndex: number;
}

const DEFAULT_LAYERS: readonly TrainLayer[] = [
  { from: 0, to: 0.46, speed: 0, offsetY: 0, zIndex: 0 },
  { from: 0.46, to: 0.64, speed: 25, offsetY: 0, zIndex: 1 },
  { from: 0.64, to: 0.73, speed: 50, offsetY: 0, zIndex: 3 },
  { from: 0.73, to: 1, speed: 0, offsetY: 0, zIndex: 2 },
];

const props = withDefaults(
  defineProps<{
    images: ImageManager;
    layers?: readonly TrainLayer[];
  }>(),
  {
    layers: () => DEFAULT_LAYERS,
  },
);

const canvas = ref<HTMLCanvasElement | null>(null);
const sceneAspectRatio = ref("4 / 1");
let image: HTMLImageElement | null = null;
let animationFrame = 0;
let startedAt = 0;

function normalizedLayers(): TrainLayer[] {
  return props.layers
    .map((layer) => ({
      ...layer,
      from: Math.max(0, Math.min(1, layer.from)),
      to: Math.max(0, Math.min(1, layer.to)),
      offsetY: Number.isFinite(layer.offsetY) ? layer.offsetY : 0,
      speed: Number.isFinite(layer.speed) ? Math.max(0, layer.speed) : 0,
    }))
    .filter((layer) => layer.to > layer.from)
    .sort((left, right) => left.zIndex - right.zIndex);
}

function updateAspectRatio(): void {
  if (!image) return;
  const layers = normalizedLayers();
  const sourceHeight = Math.max(
    1,
    ...layers.map(
      (layer) =>
        image!.naturalHeight * (layer.to - layer.from) +
        Math.max(0, layer.offsetY),
    ),
  );
  sceneAspectRatio.value = `${image.naturalWidth} / ${sourceHeight}`;
}

function drawLayer(
  context: CanvasRenderingContext2D,
  source: HTMLImageElement,
  layer: TrainLayer,
  width: number,
  height: number,
  elapsedSeconds: number,
): void {
  const sourceY = source.naturalHeight * layer.from;
  const sourceHeight = source.naturalHeight * (layer.to - layer.from);
  const scale = width / source.naturalWidth;
  const targetWidth = source.naturalWidth * scale;
  const targetHeight = sourceHeight * scale;
  const targetY = height - targetHeight - layer.offsetY * scale;

  if (layer.speed === 0) {
    context.drawImage(
      source,
      0,
      sourceY,
      source.naturalWidth,
      sourceHeight,
      0,
      targetY,
      targetWidth,
      targetHeight,
    );
    return;
  }

  const offset = -((elapsedSeconds * layer.speed) % targetWidth);
  for (let x = offset - targetWidth; x < width; x += targetWidth) {
    context.drawImage(
      source,
      0,
      sourceY,
      source.naturalWidth,
      sourceHeight,
      x,
      targetY,
      targetWidth,
      targetHeight,
    );
  }
}

function draw(now: number): void {
  const target = canvas.value;
  if (!target || !image) return;
  const bounds = target.getBoundingClientRect();
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (target.width !== pixelWidth || target.height !== pixelHeight) {
    target.width = pixelWidth;
    target.height = pixelHeight;
  }

  const context = target.getContext("2d");
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = false;

  if (startedAt === 0) startedAt = now;
  const elapsedSeconds = (now - startedAt) / 1000;
  for (const layer of normalizedLayers())
    drawLayer(context, image, layer, width, height, elapsedSeconds);

  animationFrame = requestAnimationFrame(draw);
}

onMounted(async () => {
  try {
    image = await props.images.load("original-train");
    updateAspectRatio();
    animationFrame = requestAnimationFrame(draw);
  } catch (error) {
    console.warn(error);
  }
});

watch(
  () => props.layers,
  () => {
    startedAt = 0;
    updateAspectRatio();
  },
  { deep: true },
);

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame);
  image = null;
});
</script>

<template>
  <div
    class="night-train-scene"
    :style="{ aspectRatio: sceneAspectRatio }"
    aria-hidden="true"
  >
    <canvas ref="canvas" />
  </div>
</template>

<style scoped>
.night-train-scene {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #123578;
}

.night-train-scene canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}
</style>
