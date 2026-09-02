<script setup lang="ts">
import {
  prepareCanvas,
  resolveDevicePixelRatio,
  snapRectToDevicePixels,
  type ImageManager,
} from "@bobby/engine";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  ORIGINAL_TILE_SIZE,
  STAR_ATLAS_CELLS,
  STAR_SPARKLE_SHEET,
  sparkleFrameRect,
} from "./originalSceneSprites.js";

const props = withDefaults(
  defineProps<{
    images: ImageManager;
    bigStarProbability?: number;
    smallStarProbability?: number;
    scrollSpeed?: number;
    sparkleMinDelayMs?: number;
    sparkleMaxDelayMs?: number;
    sparkleBurstMin?: number;
    sparkleBurstMax?: number;
    sparkleFrameMs?: number;
    animated?: boolean;
  }>(),
  {
    bigStarProbability: 0.05,
    smallStarProbability: 0.1,
    scrollSpeed: 20,
    sparkleMinDelayMs: 350,
    sparkleMaxDelayMs: 1000,
    sparkleBurstMin: 3,
    sparkleBurstMax: 7,
    sparkleFrameMs: 72,
    animated: true,
  },
);

interface SkyTile {
  variant: number;
  sparkleStartedAt: number | null;
}

interface StarColumn {
  x: number;
  tiles: SkyTile[];
}

const canvas = ref<HTMLCanvasElement | null>(null);
const columns: StarColumn[] = [];
let staticTiles: HTMLImageElement | null = null;
let animatedTiles: HTMLImageElement | null = null;
let animationFrame = 0;
let lastTime = 0;
let nextSparkleAt = 0;
let lastWidth = 0;
let lastHeight = 0;
let destroyed = false;

function clampProbability(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function clampInteger(value: number, minimum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.floor(value));
}

function createTile(): SkyTile {
  const bigProbability = clampProbability(props.bigStarProbability);
  const smallProbability = Math.min(
    1 - bigProbability,
    clampProbability(props.smallStarProbability),
  );
  const roll = Math.random();
  const variant =
    roll < bigProbability
      ? 0
      : roll < bigProbability + smallProbability
        ? 1
        : 2;
  return { variant, sparkleStartedAt: null };
}

function createColumn(x: number, rowCount: number): StarColumn {
  return {
    x,
    tiles: Array.from({ length: rowCount }, createTile),
  };
}

function resetColumns(width: number, height: number): void {
  columns.length = 0;
  const rowCount = Math.ceil(height / ORIGINAL_TILE_SIZE) + 1;
  const columnCount = Math.ceil(width / ORIGINAL_TILE_SIZE) + 3;
  for (let index = 0; index < columnCount; index += 1) {
    columns.push(createColumn((index - 1) * ORIGINAL_TILE_SIZE, rowCount));
  }
}

function updateColumns(height: number, elapsedSeconds: number): void {
  if (!props.animated) return;
  const speed = Math.max(0, props.scrollSpeed);
  for (const column of columns) column.x -= speed * elapsedSeconds;

  const rowCount = Math.ceil(height / ORIGINAL_TILE_SIZE) + 1;
  while (columns.length > 0 && columns[0]!.x <= -ORIGINAL_TILE_SIZE * 2) {
    columns.shift();
    const right = columns.at(-1)?.x ?? 0;
    columns.push(createColumn(right + ORIGINAL_TILE_SIZE, rowCount));
  }
}

function nextSparkleDelay(): number {
  const min = Math.max(0, props.sparkleMinDelayMs);
  const max = Math.max(min, props.sparkleMaxDelayMs);
  return min + Math.random() * (max - min);
}

function nextSparkleBurstSize(): number {
  const min = clampInteger(props.sparkleBurstMin, 0);
  const max = Math.max(min, clampInteger(props.sparkleBurstMax, min));
  return min + Math.floor(Math.random() * (max - min + 1));
}

function scheduleSparkles(now: number, width: number): void {
  if (!props.animated || !animatedTiles || now < nextSparkleAt) return;
  const candidates = columns.flatMap((column) =>
    column.x >= -ORIGINAL_TILE_SIZE && column.x <= width
      ? column.tiles.filter((tile) => tile.sparkleStartedAt === null)
      : [],
  );

  const burstSize = Math.min(nextSparkleBurstSize(), candidates.length);
  for (let index = 0; index < burstSize; index += 1) {
    const choice = Math.floor(Math.random() * candidates.length);
    const target = candidates.splice(choice, 1)[0];
    if (target) target.sparkleStartedAt = now;
  }
  nextSparkleAt = now + nextSparkleDelay();
}

function draw(now: number): void {
  const target = canvas.value;
  if (destroyed || !target || !staticTiles) return;
  const bounds = target.getBoundingClientRect();
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  if (Math.abs(width - lastWidth) > 2 || Math.abs(height - lastHeight) > 2) {
    lastWidth = width;
    lastHeight = height;
    resetColumns(width, height);
  }

  const elapsed = lastTime === 0 ? 0 : Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  updateColumns(height, elapsed);
  scheduleSparkles(now, width);

  const context = target.getContext("2d");
  if (!context) return;
  const deviceScale = resolveDevicePixelRatio();
  prepareCanvas(target, context, width, height, deviceScale);
  context.clearRect(0, 0, width, height);

  for (const column of columns) {
    for (let row = 0; row < column.tiles.length; row += 1) {
      const tile = column.tiles[row]!;
      const cell = STAR_ATLAS_CELLS[tile.variant]!;
      const y = row * ORIGINAL_TILE_SIZE;
      const tileRect = snapRectToDevicePixels(
        column.x,
        y,
        column.x + ORIGINAL_TILE_SIZE,
        y + ORIGINAL_TILE_SIZE,
        deviceScale,
      );
      context.drawImage(
        staticTiles,
        cell.column * ORIGINAL_TILE_SIZE,
        cell.row * ORIGINAL_TILE_SIZE,
        ORIGINAL_TILE_SIZE,
        ORIGINAL_TILE_SIZE,
        tileRect.x,
        tileRect.y,
        tileRect.width,
        tileRect.height,
      );

      if (!animatedTiles || tile.sparkleStartedAt === null) continue;
      const frame = Math.floor(
        (now - tile.sparkleStartedAt) / Math.max(1, props.sparkleFrameMs),
      );
      if (frame >= STAR_SPARKLE_SHEET.frameCount) {
        tile.sparkleStartedAt = null;
        continue;
      }
      const sparkle = sparkleFrameRect(frame);
      const sparkleRect = snapRectToDevicePixels(
        column.x + 16,
        y + 16,
        column.x + 32,
        y + 32,
        deviceScale,
      );
      context.drawImage(
        animatedTiles,
        sparkle.x,
        sparkle.y,
        sparkle.width,
        sparkle.height,
        sparkleRect.x,
        sparkleRect.y,
        sparkleRect.width,
        sparkleRect.height,
      );
    }
  }

  animationFrame = requestAnimationFrame(draw);
}

onMounted(async () => {
  try {
    staticTiles = await props.images.load("entity-atlas");
    if (destroyed) return;
    animationFrame = requestAnimationFrame(draw);
    void props.images
      .load("original-animated-tiles")
      .then((image) => {
        if (!destroyed) animatedTiles = image;
      })
      .catch((error) => console.warn(error));
  } catch (error) {
    console.warn(error);
  }
});

watch(
  () => [props.bigStarProbability, props.smallStarProbability],
  () => {
    if (lastWidth > 0 && lastHeight > 0) resetColumns(lastWidth, lastHeight);
  },
);
watch(
  () => props.animated,
  () => {
    lastTime = 0;
    nextSparkleAt = 0;
  },
);

onBeforeUnmount(() => {
  destroyed = true;
  cancelAnimationFrame(animationFrame);
  columns.length = 0;
  staticTiles = null;
  animatedTiles = null;
});
</script>

<template>
  <canvas ref="canvas" class="original-starfield" aria-hidden="true" />
</template>

<style scoped>
.original-starfield {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: #143678;
  image-rendering: pixelated;
}
</style>
