import { ORIGINAL_GAMEPLAY_IMAGE_IDS } from "../../image/OriginalGameplayImages.js";
import type { Camera } from "../../render/Camera.js";
import type { ScreenOverlayItem } from "../../render/RenderScene.js";
import { ambientHash01 as hash01, densityCount } from "./AmbientSampling.js";

const SNOW_STEP_MS = 31;
const SNOW_FALL_PER_STEP = 3;
const SNOWFLAKE_WIDTH = 12;
const SNOWFLAKE_HEIGHT = 8;

export interface AmbientScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface SnowParticle {
  x: number;
  y: number;
  respawns: number;
}

/** 原版固定步进雪花；粒子数量与尺寸随当前地图缩放保持格子尺度一致。 */
export class SnowVisualRuntime {
  private particles: SnowParticle[] = [];
  private bounds: AmbientScreenRect | null = null;
  private scale: number | null = null;
  private lastStep: number | null = null;
  private previousCameraY: number | null = null;

  constructor(
    private readonly seed: number,
    private readonly density: number,
  ) {}

  effects(
    bounds: AmbientScreenRect,
    camera: Camera,
    elapsedMs: number,
    clipBounds: AmbientScreenRect,
  ): ScreenOverlayItem[] {
    if (bounds.width <= 0 || bounds.height <= 0 ||
      clipBounds.width <= 0 || clipBounds.height <= 0) return [];
    const scale = camera.tileScreenSize / camera.sourceTileSize;
    const count = densityCount(
      bounds.width / scale,
      bounds.height / scale,
      this.density,
    );
    const targetStep = Math.floor(elapsedMs / SNOW_STEP_MS);
    const cameraY = camera.centerY * camera.sourceTileSize;
    if (!sameRect(this.bounds, bounds) || this.lastStep === null ||
      targetStep < this.lastStep) {
      this.initialize(bounds, scale, count, targetStep, cameraY);
    } else {
      this.resizeParticles(bounds, count, targetStep);
      // 缩放可能同时改变 Camera center；它不属于原版上下跟随速度修正。
      if (this.scale !== scale) this.previousCameraY = cameraY;
      this.advance(bounds, scale, targetStep, cameraY);
      this.scale = scale;
    }
    const renderSize = camera.tileScreenSize;
    const drawWidth = SNOWFLAKE_WIDTH * scale;
    const drawHeight = SNOWFLAKE_HEIGHT * scale;
    const clip = {
      x: clipBounds.left,
      y: clipBounds.top,
      width: clipBounds.width,
      height: clipBounds.height,
    };
    return this.particles.map((particle) => ({
      // Image layer 以原版一格作为缩放基准；偏移后素材左上角就是粒子坐标。
      x: particle.x - (renderSize - drawWidth) / 2,
      y: particle.y - (renderSize - drawHeight) / 2,
      size: renderSize,
      clip,
      composition: {
        layers: [{
          kind: "image",
          asset: ORIGINAL_GAMEPLAY_IMAGE_IDS.hudAtlas,
          sourceX: 338,
          sourceY: 0,
          frameWidth: SNOWFLAKE_WIDTH,
          frameHeight: SNOWFLAKE_HEIGHT,
          anchor: "center",
        }],
      },
    }));
  }

  clear(): void {
    this.particles = [];
    this.bounds = null;
    this.scale = null;
    this.lastStep = null;
    this.previousCameraY = null;
  }

  private initialize(
    bounds: AmbientScreenRect,
    scale: number,
    count: number,
    targetStep: number,
    cameraY: number,
  ): void {
    this.bounds = { ...bounds };
    this.scale = scale;
    this.particles = Array.from(
      { length: count },
      (_, index) => this.createParticle(bounds, index, targetStep),
    );
    this.lastStep = targetStep;
    this.previousCameraY = cameraY;
  }

  private resizeParticles(
    bounds: AmbientScreenRect,
    count: number,
    targetStep: number,
  ): void {
    if (this.particles.length > count) {
      this.particles.length = count;
      return;
    }
    for (let index = this.particles.length; index < count; index += 1)
      this.particles.push(this.createParticle(bounds, index, targetStep));
  }

  private createParticle(
    bounds: AmbientScreenRect,
    index: number,
    timeSalt: number,
  ): SnowParticle {
    return {
      x: lerp(
        bounds.left,
        bounds.right,
        hash01(this.seed, index, timeSalt + 3),
      ),
      y: lerp(
        bounds.top,
        bounds.bottom,
        hash01(this.seed, index, timeSalt + 5),
      ),
      respawns: 0,
    };
  }

  private advance(
    bounds: AmbientScreenRect,
    scale: number,
    targetStep: number,
    cameraY: number,
  ): void {
    const lastStep = this.lastStep ?? targetStep;
    const baseFall = SNOW_FALL_PER_STEP * scale;
    const verticalDelta = this.previousCameraY === null
      ? baseFall
      : cameraY > this.previousCameraY
        ? baseFall / 2
        : cameraY < this.previousCameraY
          ? baseFall * 1.5
          : baseFall;
    for (let step = lastStep + 1; step <= targetStep; step += 1) {
      this.particles.forEach((particle, index) => {
        if (particle.y > bounds.bottom) {
          particle.respawns += 1;
          particle.x = lerp(
            bounds.left,
            bounds.right,
            hash01(this.seed, index, particle.respawns * 2 + 101),
          );
          particle.y = bounds.top - Math.floor(
            hash01(this.seed, index, particle.respawns * 2 + 102) * 10,
          ) * scale;
        }
        const horizontalStep =
          Math.floor(hash01(this.seed, index, step + 211) * 3) - 1;
        particle.x += horizontalStep * scale;
        particle.y += verticalDelta;
      });
    }
    this.lastStep = targetStep;
    this.previousCameraY = cameraY;
  }
}

function sameRect(
  left: AmbientScreenRect | null,
  right: AmbientScreenRect,
): boolean {
  return left !== null &&
    left.left === right.left &&
    left.top === right.top &&
    left.right === right.right &&
    left.bottom === right.bottom;
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}
