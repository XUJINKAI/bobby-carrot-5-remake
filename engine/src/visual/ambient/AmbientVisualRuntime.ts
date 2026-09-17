import { MapEntityTypeId } from "@bobby/model";
import type { Camera } from "../../render/Camera.js";
import type {
  ScreenOverlayItem,
  WorldOverlayItem,
} from "../../render/RenderScene.js";
import type { PresentationFrame } from "../../time/PresentationClock.js";
import type { World } from "../../world/World.js";
import type { AmbientVisualState } from "../VisualDefinition.js";
import { sparkleFrameRect } from "./OriginalAmbientSprites.js";

const BONUS_COIN_FRAME_MS = 124;
const BONUS_COIN_SPARKLE_FRAMES = 3;
const BONUS_COIN_GATE_DIVISOR = 8;
const SKY_SHIMMER_FRAME_MS = 124;
const SKY_SHIMMER_FRAMES = 8;
const SKY_SHIMMER_SLOTS = 3;
const DEFAULT_AMBIENT_SEED = 0x5b0bb7;
const DENSITY_AREA = 1_000_000;
const DEFAULT_SNOW_DENSITY = 65;
const DEFAULT_BUTTERFLY_DENSITY = 1;
const SNOWFLAKE_SIZE = 8;
const BUTTERFLY_SIZE = 48;

interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface AmbientVisualOptions {
  seed?: number;
  /** 每百万 CSS 像素的雪花数量。 */
  snowDensity?: number;
  /** 每百万 CSS 像素的蝴蝶数量。 */
  butterflyDensity?: number;
}

export interface AmbientVisualEffects {
  background: readonly WorldOverlayItem[];
  foreground: readonly ScreenOverlayItem[];
}

/** 同一表现会话内共享的环境动画状态；不进入 World、Snapshot 或 Replay。 */
export class AmbientVisualRuntime {
  private readonly seed: number;
  private readonly snowDensity: number;
  private readonly butterflyDensity: number;
  private originMs: number | null = null;
  private lastBonusCoinSlot = -1;
  private bonusCoinFrame: number | null = null;
  private environmentWorld: World | null = null;
  private snowWeather: boolean | null = null;
  private pureSky: boolean | null = null;

  constructor(options: AmbientVisualOptions = {}) {
    this.seed = finiteInteger(options.seed, DEFAULT_AMBIENT_SEED);
    this.snowDensity = nonNegative(
      options.snowDensity,
      DEFAULT_SNOW_DENSITY,
    );
    this.butterflyDensity = nonNegative(
      options.butterflyDensity,
      DEFAULT_BUTTERFLY_DENSITY,
    );
  }

  get state(): AmbientVisualState {
    return { bonusCoinSparkleFrame: this.bonusCoinFrame };
  }

  update(frame: PresentationFrame): void {
    const elapsedMs = this.elapsed(frame);
    const targetSlot = Math.floor(elapsedMs / BONUS_COIN_FRAME_MS);
    if (targetSlot < this.lastBonusCoinSlot) {
      this.lastBonusCoinSlot = -1;
      this.bonusCoinFrame = null;
    }
    for (let slot = this.lastBonusCoinSlot + 1; slot <= targetSlot; slot += 1)
      this.advanceBonusCoin(slot);
    this.lastBonusCoinSlot = targetSlot;
  }

  effects(
    world: World,
    camera: Camera,
    frame: PresentationFrame | undefined,
  ): AmbientVisualEffects {
    if (this.environmentWorld !== world) {
      this.environmentWorld = world;
      this.snowWeather = world.query.entityCountMatching({
        kind: "type",
        value: MapEntityTypeId.SNOW,
      }) > 0;
      this.pureSky = isPureSkyWorld(world);
    }
    const elapsedMs = frame ? this.elapsed(frame) : 0;
    const bounds = visibleMapRect(world, camera);
    return {
      background: this.skyShimmers(world, camera, elapsedMs),
      foreground: this.snowWeather === true
        ? this.snowflakes(bounds, elapsedMs)
        : this.pureSky === true
          ? []
          : this.butterflies(bounds, elapsedMs),
    };
  }

  clear(): void {
    this.originMs = null;
    this.lastBonusCoinSlot = -1;
    this.bonusCoinFrame = null;
    this.environmentWorld = null;
    this.snowWeather = null;
    this.pureSky = null;
  }

  private elapsed(frame: PresentationFrame): number {
    if (this.originMs === null) this.originMs = frame.nowMs;
    return Math.max(0, frame.nowMs - this.originMs);
  }

  private advanceBonusCoin(slot: number): void {
    if (this.bonusCoinFrame !== null) {
      this.bonusCoinFrame =
        this.bonusCoinFrame + 1 < BONUS_COIN_SPARKLE_FRAMES
          ? this.bonusCoinFrame + 1
          : null;
      return;
    }
    if (deterministicGate(this.seed, slot, BONUS_COIN_GATE_DIVISOR))
      this.bonusCoinFrame = 0;
  }

  private skyShimmers(
    world: World,
    camera: Camera,
    elapsedMs: number,
  ): WorldOverlayItem[] {
    const candidates = visibleSkyCells(world, camera);
    if (candidates.length === 0) return [];
    const items: WorldOverlayItem[] = [];
    const timeSlot = Math.floor(elapsedMs / SKY_SHIMMER_FRAME_MS);
    for (let slot = 0; slot < SKY_SHIMMER_SLOTS; slot += 1) {
      const delay = 1 + Math.floor(hash01(this.seed, slot, 1) * 8);
      const span = delay + SKY_SHIMMER_FRAMES;
      const cycle = Math.floor((timeSlot + slot * 3) / span);
      const frame = (timeSlot + slot * 3) % span - delay;
      if (frame < 0 || frame >= SKY_SHIMMER_FRAMES) continue;
      const cell = candidates[Math.floor(
        hash01(this.seed, slot, cycle + 17) * candidates.length,
      )]!;
      const source = sparkleFrameRect(frame);
      const offsetX = hash01(this.seed, slot, cycle + 31);
      const offsetY = hash01(this.seed, slot, cycle + 47);
      items.push({
        visualX: cell.x + offsetX - 0.5,
        visualY: cell.y + offsetY - 0.5,
        composition: {
          layers: [{
            kind: "image",
            asset: "original-animated-tiles",
            sourceX: source.x,
            sourceY: source.y,
            frameWidth: source.width,
            frameHeight: source.height,
            anchor: "center",
          }],
        },
      });
    }
    return items;
  }

  private snowflakes(
    bounds: ScreenRect,
    elapsedMs: number,
  ): ScreenOverlayItem[] {
    if (bounds.width < SNOWFLAKE_SIZE || bounds.height < SNOWFLAKE_SIZE)
      return [];
    const count = densityCount(bounds.width, bounds.height, this.snowDensity);
    const inset = insetRect(bounds, SNOWFLAKE_SIZE / 2);
    return Array.from({ length: count }, (_, index) => {
      const cycleMs = 2600 + hash01(this.seed, index, 3) * 1800;
      const progress = ((elapsedMs + hash01(this.seed, index, 5) * cycleMs) %
        cycleMs) / cycleMs;
      const baseX = lerp(inset.left, inset.right, hash01(this.seed, index, 7));
      const drift = Math.sin(elapsedMs / 700 + index * 2.1) * 12;
      return {
        x: clamp(baseX + drift, inset.left, inset.right) - SNOWFLAKE_SIZE / 2,
        y: lerp(inset.top, inset.bottom, progress) - SNOWFLAKE_SIZE / 2,
        size: SNOWFLAKE_SIZE,
        composition: { layers: [{ kind: "canvas", draw: drawSnowflake }] },
      };
    });
  }

  private butterflies(
    bounds: ScreenRect,
    elapsedMs: number,
  ): ScreenOverlayItem[] {
    if (bounds.width < BUTTERFLY_SIZE || bounds.height < BUTTERFLY_SIZE)
      return [];
    const count = densityCount(
      bounds.width,
      bounds.height,
      this.butterflyDensity,
    );
    const inset = insetRect(bounds, BUTTERFLY_SIZE / 2);
    return Array.from({ length: count }, (_, index) => {
      const segmentMs = 9000 + hash01(this.seed, index, 11) * 8000;
      const shiftedMs = elapsedMs + hash01(this.seed, index, 13) * segmentMs;
      const segment = Math.floor(shiftedMs / segmentMs);
      const progress = (shiftedMs % segmentMs) / segmentMs;
      const start = butterflyWaypoint(this.seed, index, segment, inset);
      const control = butterflyControlPoint(this.seed, index, segment, inset);
      const end = butterflyWaypoint(this.seed, index, segment + 1, inset);
      const point = quadraticPoint(start, control, end, smoothStep(progress));
      const frameStep = Math.floor(
        (elapsedMs + hash01(this.seed, index, 19) * 558) / 93,
      ) % 6;
      const frame = frameStep < 3 ? frameStep : 5 - frameStep;
      return {
        x: point.x - BUTTERFLY_SIZE / 2,
        y: point.y - BUTTERFLY_SIZE / 2,
        size: BUTTERFLY_SIZE,
        composition: {
          layers: [{
            kind: "image",
            asset: "ambient-butterfly",
            sourceX: 0,
            sourceY: frame * 24,
            frameWidth: 24,
            frameHeight: 24,
            anchor: "center",
          }],
        },
      };
    });
  }
}

export function densityCount(
  width: number,
  height: number,
  perMillionPixels: number,
): number {
  if (perMillionPixels <= 0) return 0;
  return Math.min(
    256,
    Math.max(1, Math.round(width * height / DENSITY_AREA * perMillionPixels)),
  );
}

function visibleSkyCells(world: World, camera: Camera) {
  const start = camera.screenToTile(0, 0);
  const end = camera.screenToTile(camera.viewportWidth, camera.viewportHeight);
  const cells: { x: number; y: number }[] = [];
  for (
    let y = Math.max(0, start.y - 1);
    y <= Math.min(world.height - 1, end.y + 1);
    y += 1
  ) {
    for (
      let x = Math.max(0, start.x - 1);
      x <= Math.min(world.width - 1, end.x + 1);
      x += 1
    ) {
      const presences = world.query.allPresencesAt({ x, y });
      if (!presences.some((presence) => presence.facts.includes("sky")))
        continue;
      if (presences.some((presence) => !presence.facts.includes("sky")))
        continue;
      cells.push({ x, y });
    }
  }
  return cells;
}

function drawSnowflake(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  const center = size / 2;
  context.save();
  context.fillStyle = "rgba(255,255,255,.92)";
  context.fillRect(x + center - 1, y, 2, size);
  context.fillRect(x, y + center - 1, size, 2);
  context.restore();
}

function deterministicGate(seed: number, slot: number, divisor: number): boolean {
  return Math.floor(hash01(seed, slot, 0) * divisor) === 0;
}

function hash01(seed: number, first: number, second: number): number {
  let value = (seed ^ Math.imul(first + 1, 0x9e3779b1) ^
    Math.imul(second + 1, 0x85ebca6b)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35) >>> 0;
  return ((value ^ (value >>> 16)) >>> 0) / 0x1_0000_0000;
}

function visibleMapRect(world: World, camera: Camera): ScreenRect {
  const start = camera.worldToScreen(0, 0);
  const end = camera.worldToScreen(world.width, world.height);
  const left = clamp(Math.min(start.x, end.x), 0, camera.viewportWidth);
  const top = clamp(Math.min(start.y, end.y), 0, camera.viewportHeight);
  const right = clamp(Math.max(start.x, end.x), 0, camera.viewportWidth);
  const bottom = clamp(Math.max(start.y, end.y), 0, camera.viewportHeight);
  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function isPureSkyWorld(world: World): boolean {
  if (world.width <= 0 || world.height <= 0) return false;
  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) {
      if (!world.query.allPresencesAt({ x, y }).some((presence) =>
        presence.facts.includes("sky")
      )) return false;
    }
  }
  return true;
}

function insetRect(rect: ScreenRect, inset: number): ScreenRect {
  const left = rect.left + inset;
  const top = rect.top + inset;
  const right = rect.right - inset;
  const bottom = rect.bottom - inset;
  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function butterflyWaypoint(
  seed: number,
  index: number,
  segment: number,
  bounds: ScreenRect,
): { x: number; y: number } {
  return {
    x: lerp(bounds.left, bounds.right, hash01(seed, index * 2 + 101, segment)),
    y: lerp(bounds.top, bounds.bottom, hash01(seed, index * 2 + 102, segment)),
  };
}

function butterflyControlPoint(
  seed: number,
  index: number,
  segment: number,
  bounds: ScreenRect,
): { x: number; y: number } {
  return {
    x: lerp(
      bounds.left,
      bounds.right,
      hash01(seed, index * 2 + 201, segment),
    ),
    y: lerp(
      bounds.top,
      bounds.bottom,
      hash01(seed, index * 2 + 202, segment),
    ),
  };
}

function quadraticPoint(
  start: { x: number; y: number },
  control: { x: number; y: number },
  end: { x: number; y: number },
  progress: number,
): { x: number; y: number } {
  const remaining = 1 - progress;
  return {
    x: remaining ** 2 * start.x +
      2 * remaining * progress * control.x + progress ** 2 * end.x,
    y: remaining ** 2 * start.y +
      2 * remaining * progress * control.y + progress ** 2 * end.y,
  };
}

function smoothStep(value: number): number {
  return value * value * (3 - 2 * value);
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function finiteInteger(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Math.trunc(value!) : fallback;
}

function nonNegative(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, value!) : fallback;
}
