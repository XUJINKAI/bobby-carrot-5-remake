<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import { onBeforeUnmount, onMounted, ref } from "vue";
import SpriteFrame from "./SpriteFrame.vue";
import {
  ORIGINAL_TILE_SIZE,
  STAR_ATLAS_CELLS,
  STAR_SPARKLE_SHEET,
  sparkleFrameRect,
} from "./originalSceneSprites.js";

const props = withDefaults(
  defineProps<{
    images: ImageManager;
    compact?: boolean;
    showTitle?: boolean;
  }>(),
  {
    compact: false,
    showTitle: true,
  },
);

interface SkyStar {
  y: number;
  variant: number;
  sparkleStartedAt: number | null;
}

interface StarColumn {
  x: number;
  stars: SkyStar[];
}

const skyCanvas = ref<HTMLCanvasElement | null>(null);
const columns: StarColumn[] = [];
const STAR_SPEED_PX_PER_SECOND = 42;
const STAR_SIZE = 48;
const SPARKLE_FRAME_MS = 72;
let staticTiles: HTMLImageElement | null = null;
let animatedTiles: HTMLImageElement | null = null;
let animationFrame = 0;
let lastTime = 0;
let nextSparkleAt = 0;
let lastWidth = 0;
let lastHeight = 0;
let reducedMotion = false;

function randomStar(height: number): SkyStar {
  return {
    y: height * (0.08 + Math.random() * 0.84),
    variant: Math.floor(Math.random() * STAR_ATLAS_CELLS.length),
    sparkleStartedAt: null,
  };
}

function createColumn(x: number, height: number): StarColumn {
  const count = 1 + Math.floor(Math.random() * 3);
  return {
    x,
    stars: Array.from({ length: count }, () => randomStar(height)),
  };
}

function resetColumns(width: number, height: number): void {
  columns.length = 0;
  const spacing = Math.max(128, Math.min(190, width / 4.5));
  for (let x = -spacing; x <= width + spacing; x += spacing)
    columns.push(createColumn(x, height));
}

function updateColumns(width: number, height: number, elapsedSeconds: number): void {
  if (reducedMotion) return;
  const spacing = Math.max(128, Math.min(190, width / 4.5));
  for (const column of columns)
    column.x -= STAR_SPEED_PX_PER_SECOND * elapsedSeconds;
  while (columns.length > 0 && columns[0]!.x < -STAR_SIZE * 1.5) {
    columns.shift();
    const right = columns.at(-1)?.x ?? width;
    columns.push(createColumn(right + spacing, height));
  }
}

function scheduleSparkle(now: number, width: number): void {
  if (reducedMotion || now < nextSparkleAt) return;
  const visible = columns.flatMap((column) =>
    column.x >= -STAR_SIZE && column.x <= width + STAR_SIZE
      ? column.stars.map((star) => ({ star }))
      : [],
  );
  const target = visible[Math.floor(Math.random() * visible.length)];
  if (target) target.star.sparkleStartedAt = now;
  nextSparkleAt = now + 420 + Math.random() * 900;
}

function draw(now: number): void {
  const canvas = skyCanvas.value;
  if (!canvas || !staticTiles || !animatedTiles) return;
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  if (Math.abs(width - lastWidth) > 2 || Math.abs(height - lastHeight) > 2) {
    lastWidth = width;
    lastHeight = height;
    resetColumns(width, height);
  }
  const elapsed = lastTime === 0 ? 0 : Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  updateColumns(width, height, elapsed);
  scheduleSparkle(now, width);

  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = false;

  for (const column of columns) {
    for (const star of column.stars) {
      const cell = STAR_ATLAS_CELLS[star.variant]!;
      context.drawImage(
        staticTiles,
        cell.column * ORIGINAL_TILE_SIZE,
        cell.row * ORIGINAL_TILE_SIZE,
        ORIGINAL_TILE_SIZE,
        ORIGINAL_TILE_SIZE,
        column.x,
        star.y - STAR_SIZE / 2,
        STAR_SIZE,
        STAR_SIZE,
      );
      if (star.sparkleStartedAt === null) continue;
      const frame = Math.floor((now - star.sparkleStartedAt) / SPARKLE_FRAME_MS);
      if (frame >= STAR_SPARKLE_SHEET.frameCount) {
        star.sparkleStartedAt = null;
        continue;
      }
      const sparkle = sparkleFrameRect(frame);
      const sparkleSize = 24;
      context.drawImage(
        animatedTiles,
        sparkle.x,
        sparkle.y,
        sparkle.width,
        sparkle.height,
        column.x + STAR_SIZE * 0.47,
        star.y - sparkleSize * 0.65,
        sparkleSize,
        sparkleSize,
      );
    }
  }
  animationFrame = requestAnimationFrame(draw);
}

onMounted(async () => {
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    [staticTiles, animatedTiles] = await Promise.all([
      props.images.load("entity-atlas"),
      props.images.load("original-animated-tiles"),
    ]);
    animationFrame = requestAnimationFrame(draw);
  } catch (error) {
    console.warn(error);
  }
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame);
  staticTiles = null;
  animatedTiles = null;
  columns.length = 0;
});
</script>

<template>
  <section class="original-flight-scene" :class="{ compact }">
    <canvas ref="skyCanvas" class="flight-stars" aria-hidden="true" />
    <div v-if="showTitle" class="flight-title">
      <SpriteFrame :images="images" asset="original-title" />
    </div>
    <div class="flight-bobby" aria-hidden="true">
      <SpriteFrame :images="images" asset="bobby-kite" :columns="4" :frame="1" />
    </div>
  </section>
</template>

<style scoped>
.original-flight-scene {
  position: relative;
  min-height: 330px;
  overflow: hidden;
  isolation: isolate;
}

.flight-stars {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.flight-title {
  position: absolute;
  z-index: 2;
  top: 2%;
  left: 50%;
  width: min(88%, 560px);
  max-height: 56%;
  transform: translateX(-50%);
}

.flight-bobby {
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: 3%;
  width: min(44%, 250px);
  transform: translateX(-50%);
  animation:
    flight-enter 900ms cubic-bezier(0.2, 0.85, 0.3, 1.1) both,
    flight-bob 3.4s ease-in-out 900ms infinite;
}

.original-flight-scene.compact {
  min-height: 280px;
}

.original-flight-scene.compact .flight-title {
  width: min(92%, 430px);
}

.original-flight-scene.compact .flight-bobby {
  width: min(46%, 210px);
  bottom: 2%;
}

@keyframes flight-enter {
  from {
    opacity: 0;
    transform: translate(-120%, 34%);
  }
  72% {
    opacity: 1;
    transform: translate(-45%, -3%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes flight-bob {
  0%,
  100% {
    transform: translate(-50%, 0);
  }
  50% {
    transform: translate(-50%, -7px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flight-bobby {
    animation: none;
    transform: translateX(-50%);
  }
}
</style>
