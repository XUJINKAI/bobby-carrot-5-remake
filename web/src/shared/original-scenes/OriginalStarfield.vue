<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  ORIGINAL_TILE_SIZE,
  STAR_ATLAS_CELLS,
  STAR_SPARKLE_SHEET,
  sparkleFrameRect,
} from "./originalSceneSprites.js";

const props = defineProps<{ images: ImageManager }>();

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
const SPEED_PX_PER_SECOND = 42;
const SPARKLE_FRAME_MS = 72;
let staticTiles: HTMLImageElement | null = null;
let animatedTiles: HTMLImageElement | null = null;
let animationFrame = 0;
let lastTime = 0;
let nextSparkleAt = 0;
let lastWidth = 0;
let lastHeight = 0;
let reducedMotion = false;

function createTile(): SkyTile {
  return {
    variant: Math.floor(Math.random() * STAR_ATLAS_CELLS.length),
    sparkleStartedAt: null,
  };
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
    columns.push(
      createColumn((index - 1) * ORIGINAL_TILE_SIZE, rowCount),
    );
  }
}

function updateColumns(height: number, elapsedSeconds: number): void {
  if (reducedMotion) return;
  for (const column of columns)
    column.x -= SPEED_PX_PER_SECOND * elapsedSeconds;

  const rowCount = Math.ceil(height / ORIGINAL_TILE_SIZE) + 1;
  while (columns.length > 0 && columns[0]!.x <= -ORIGINAL_TILE_SIZE * 2) {
    columns.shift();
    const right = columns.at(-1)?.x ?? 0;
    columns.push(createColumn(right + ORIGINAL_TILE_SIZE, rowCount));
  }
}

function scheduleSparkle(now: number, width: number): void {
  if (reducedMotion || now < nextSparkleAt) return;
  const candidates = columns.flatMap((column) =>
    column.x >= -ORIGINAL_TILE_SIZE && column.x <= width
      ? column.tiles.map((tile) => tile)
      : [],
  );
  const target = candidates[Math.floor(Math.random() * candidates.length)];
  if (target) target.sparkleStartedAt = now;
  nextSparkleAt = now + 420 + Math.random() * 900;
}

function draw(now: number): void {
  const target = canvas.value;
  if (!target || !staticTiles || !animatedTiles) return;
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
  if (Math.abs(width - lastWidth) > 2 || Math.abs(height - lastHeight) > 2) {
    lastWidth = width;
    lastHeight = height;
    resetColumns(width, height);
  }

  const elapsed = lastTime === 0 ? 0 : Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  updateColumns(height, elapsed);
  scheduleSparkle(now, width);

  const context = target.getContext("2d");
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = false;

  for (const column of columns) {
    for (let row = 0; row < column.tiles.length; row += 1) {
      const tile = column.tiles[row]!;
      const cell = STAR_ATLAS_CELLS[tile.variant]!;
      const y = row * ORIGINAL_TILE_SIZE;
      context.drawImage(
        staticTiles,
        cell.column * ORIGINAL_TILE_SIZE,
        cell.row * ORIGINAL_TILE_SIZE,
        ORIGINAL_TILE_SIZE,
        ORIGINAL_TILE_SIZE,
        column.x,
        y,
        ORIGINAL_TILE_SIZE,
        ORIGINAL_TILE_SIZE,
      );

      if (tile.sparkleStartedAt === null) continue;
      const frame = Math.floor((now - tile.sparkleStartedAt) / SPARKLE_FRAME_MS);
      if (frame >= STAR_SPARKLE_SHEET.frameCount) {
        tile.sparkleStartedAt = null;
        continue;
      }
      const sparkle = sparkleFrameRect(frame);
      context.drawImage(
        animatedTiles,
        sparkle.x,
        sparkle.y,
        sparkle.width,
        sparkle.height,
        column.x + 16,
        y + 16,
        16,
        16,
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
  background: #143678;
  image-rendering: pixelated;
}
</style>
