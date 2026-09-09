import type { PresentationFrame } from "../time/PresentationClock.js";

export interface CameraPoint {
  x: number;
  y: number;
}

export type CameraPanBounds = "viewport" | "map-edge";

export interface CameraOptions {
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  followDurationMs?: number;
  panBounds?: CameraPanBounds;
}

export const DEFAULT_CAMERA_OPTIONS: Readonly<Required<CameraOptions>> = {
  zoom: 1,
  minZoom: .25,
  maxZoom: 4,
  followDurationMs: 320,
  panBounds: "viewport",
} as const;

interface PanReturn {
  fromX: number;
  fromY: number;
  startedAtMs: number;
  durationMs: number;
}

interface CameraShake {
  startedAtMs: number;
  durationMs: number;
  amplitudeSourcePx: number;
}

interface FollowTransition {
  fromX: number;
  fromY: number;
  startedAtMs: number;
  durationMs: number;
}

const FOLLOW_JUMP_THRESHOLD_CELLS = 0.5;

export class Camera {
  centerX = 0;
  centerY = 0;
  viewportWidth = 1;
  viewportHeight = 1;
  zoom: number = DEFAULT_CAMERA_OPTIONS.zoom;
  readonly sourceTileSize: number;
  private minZoom: number = DEFAULT_CAMERA_OPTIONS.minZoom;
  private maxZoom: number = DEFAULT_CAMERA_OPTIONS.maxZoom;
  private panOffsetX = 0;
  private panOffsetY = 0;
  /** 保留最近一次回中 tween，便于 Debug Presentation 倒一帧。 */
  private panReturn: PanReturn | null = null;
  private followedX: number | null = null;
  private followedY: number | null = null;
  private followedWorldWidth = 0;
  private followedWorldHeight = 0;
  private followTransition: FollowTransition | null = null;
  private readonly followDurationMs: number;
  private readonly panBounds: CameraPanBounds;
  private panInteractionActive = false;
  private shakeState: CameraShake | null = null;
  private shakeOffsetX = 0;
  private shakeOffsetY = 0;

  constructor(sourceTileSize = 48, options: CameraOptions = {}) {
    this.sourceTileSize = sourceTileSize;
    this.followDurationMs = nonNegativeFinite(
      options.followDurationMs,
      DEFAULT_CAMERA_OPTIONS.followDurationMs,
    );
    this.panBounds =
      options.panBounds === "map-edge"
        ? "map-edge"
        : DEFAULT_CAMERA_OPTIONS.panBounds;
    const minZoom = positiveFinite(
      options.minZoom,
      DEFAULT_CAMERA_OPTIONS.minZoom,
    );
    const maxZoom = Math.max(
      minZoom,
      positiveFinite(options.maxZoom, DEFAULT_CAMERA_OPTIONS.maxZoom),
    );
    this.setZoomLimits(minZoom, maxZoom);
    this.setZoom(positiveFinite(options.zoom, DEFAULT_CAMERA_OPTIONS.zoom));
  }

  get tileScreenSize(): number {
    return this.sourceTileSize * this.zoom;
  }

  get hasPanOffset(): boolean {
    return (
      Math.abs(this.panOffsetX) > 0.0001 || Math.abs(this.panOffsetY) > 0.0001
    );
  }

  get shaking(): boolean {
    return this.shakeState !== null;
  }

  setViewport(width: number, height: number): void {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
  }

  setZoomLimits(min: number, max = DEFAULT_CAMERA_OPTIONS.maxZoom): void {
    const safeMin = Number.isFinite(min)
      ? Math.max(0.1, min)
      : DEFAULT_CAMERA_OPTIONS.minZoom;
    const safeMax = Number.isFinite(max)
      ? Math.max(safeMin, max)
      : DEFAULT_CAMERA_OPTIONS.maxZoom;
    this.minZoom = safeMin;
    this.maxZoom = safeMax;
    this.setZoom(this.zoom);
  }

  setZoom(value: number): void {
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, value));
  }

  setZoomAt(value: number, screenX: number, screenY: number): void {
    if (!Number.isFinite(screenX) || !Number.isFinite(screenY)) return;
    const previousSize = this.tileScreenSize;
    if (previousSize <= 0) return;
    const world = this.screenToWorld(screenX, screenY);
    this.setZoom(value);
    const nextSize = this.tileScreenSize;
    if (nextSize === previousSize || nextSize <= 0) return;
    this.cancelFollowTransitionForInteraction();
    const nextCenterX =
      world.x -
      (screenX - this.shakeOffsetX - this.viewportWidth / 2) / nextSize;
    const nextCenterY =
      world.y -
      (screenY - this.shakeOffsetY - this.viewportHeight / 2) / nextSize;
    this.panOffsetX += nextCenterX - this.centerX;
    this.panOffsetY += nextCenterY - this.centerY;
    this.centerX = nextCenterX;
    this.centerY = nextCenterY;
  }

  resetFollow(): void {
    this.followedX = null;
    this.followedY = null;
    this.followedWorldWidth = 0;
    this.followedWorldHeight = 0;
    this.followTransition = null;
  }

  resetPan(): void {
    this.panOffsetX = 0;
    this.panOffsetY = 0;
    this.panReturn = null;
    this.panInteractionActive = false;
  }

  panByScreen(dx: number, dy: number): void {
    const size = this.tileScreenSize;
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || size <= 0) return;
    this.cancelFollowTransitionForInteraction();
    this.panReturn = null;
    this.panInteractionActive = true;
    this.panOffsetX -= dx / size;
    this.panOffsetY -= dy / size;
  }

  /** 下一次 gameplay movement 时调用；Pan 回中只使用 Presentation 时间。 */
  recenterPan(frame: PresentationFrame, durationMs = 260): void {
    if (this.panReturn) {
      const endMs = this.panReturn.startedAtMs + this.panReturn.durationMs;
      if (frame.nowMs < endMs) return;
      this.panReturn = null;
    }
    if (!this.hasPanOffset) {
      this.resetPan();
      return;
    }
    this.panReturn = {
      fromX: this.panOffsetX,
      fromY: this.panOffsetY,
      startedAtMs: frame.nowMs,
      durationMs: Math.max(0, durationMs),
    };
  }

  /** Pure presentation effect; gameplay emits semantic impact events, never camera commands. */
  shake(
    frame: PresentationFrame,
    durationMs = 150,
    amplitudeSourcePx = 6,
  ): void {
    this.shakeState = {
      startedAtMs: frame.nowMs,
      durationMs: Math.max(0, durationMs),
      amplitudeSourcePx: Math.max(0, amplitudeSourcePx),
    };
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  resetShake(): void {
    this.shakeState = null;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  update(frame: PresentationFrame): void {
    this.updatePanReturn(frame);
    this.updateShake(frame);
  }

  follow(
    point: CameraPoint,
    worldWidth: number,
    worldHeight: number,
    frame?: PresentationFrame,
  ): void {
    const baseX = point.x + 0.5;
    const baseY = point.y + 0.5;
    const hasFollowTarget = this.followedX !== null && this.followedY !== null;
    const targetJumped =
      hasFollowTarget &&
      Math.hypot(baseX - this.followedX!, baseY - this.followedY!) >
        FOLLOW_JUMP_THRESHOLD_CELLS;
    if (targetJumped && frame && this.followDurationMs > 0) {
      this.followTransition = {
        fromX: this.centerX,
        fromY: this.centerY,
        startedAtMs: frame.nowMs,
        durationMs: this.followDurationMs,
      };
    }
    this.followedX = baseX;
    this.followedY = baseY;
    this.followedWorldWidth = worldWidth;
    this.followedWorldHeight = worldHeight;

    const baseline = this.clampToViewport(
      baseX,
      baseY,
      worldWidth,
      worldHeight,
    );
    const desired = this.clampForInteraction(
      baseline.x + this.panOffsetX,
      baseline.y + this.panOffsetY,
      worldWidth,
      worldHeight,
    );
    this.panOffsetX = desired.x - baseline.x;
    this.panOffsetY = desired.y - baseline.y;
    const transition = this.followTransition;
    if (!hasFollowTarget || !transition || !frame) {
      this.centerX = desired.x;
      this.centerY = desired.y;
      return;
    }

    const raw = Math.min(
      1,
      Math.max(0, (frame.nowMs - transition.startedAtMs) / transition.durationMs),
    );
    const eased = 1 - (1 - raw) ** 3;
    this.centerX = transition.fromX + (desired.x - transition.fromX) * eased;
    this.centerY = transition.fromY + (desired.y - transition.fromY) * eased;
    if (raw >= 1) this.followTransition = null;
  }

  worldToScreen(x: number, y: number): CameraPoint {
    const size = this.tileScreenSize;
    return {
      x:
        (x - this.centerX) * size +
        this.viewportWidth / 2 +
        this.shakeOffsetX,
      y:
        (y - this.centerY) * size +
        this.viewportHeight / 2 +
        this.shakeOffsetY,
    };
  }

  screenToTile(screenX: number, screenY: number): CameraPoint {
    const point = this.screenToWorld(screenX, screenY);
    return {
      x: Math.floor(point.x),
      y: Math.floor(point.y),
    };
  }

  private screenToWorld(screenX: number, screenY: number): CameraPoint {
    const size = this.tileScreenSize;
    return {
      x:
        (screenX - this.shakeOffsetX - this.viewportWidth / 2) / size +
        this.centerX,
      y:
        (screenY - this.shakeOffsetY - this.viewportHeight / 2) / size +
        this.centerY,
    };
  }

  private cancelFollowTransitionForInteraction(): void {
    this.followTransition = null;
    const baseline = this.followBaseline();
    if (!baseline) return;
    this.panOffsetX = this.centerX - baseline.x;
    this.panOffsetY = this.centerY - baseline.y;
  }

  private updatePanReturn(frame: PresentationFrame): void {
    const returning = this.panReturn;
    if (!returning) return;
    const elapsedMs = Math.max(0, frame.nowMs - returning.startedAtMs);
    const raw =
      returning.durationMs <= 0
        ? 1
        : Math.min(1, elapsedMs / returning.durationMs);
    const eased = 1 - (1 - raw) ** 3;
    const remaining = 1 - eased;
    this.panOffsetX = returning.fromX * remaining;
    this.panOffsetY = returning.fromY * remaining;
    if (raw >= 1) {
      this.resetPan();
    }
  }

  private updateShake(frame: PresentationFrame): void {
    const shake = this.shakeState;
    if (!shake) return;
    const elapsedMs = Math.max(0, frame.nowMs - shake.startedAtMs);
    const raw =
      shake.durationMs <= 0 ? 1 : Math.min(1, elapsedMs / shake.durationMs);
    if (raw >= 1) {
      this.resetShake();
      return;
    }
    const amplitude = shake.amplitudeSourcePx * this.zoom * (1 - raw);
    // Deterministic presentation-time oscillation keeps Debug rewind reproducible.
    this.shakeOffsetX = Math.sin(elapsedMs * 0.115) * amplitude;
    this.shakeOffsetY = Math.sin(elapsedMs * 0.173 + 1.2) * amplitude * 0.72;
  }

  private followBaseline(): CameraPoint | null {
    if (this.followedX === null || this.followedY === null) return null;
    return this.clampToViewport(
      this.followedX,
      this.followedY,
      this.followedWorldWidth,
      this.followedWorldHeight,
    );
  }

  private clampForInteraction(
    centerX: number,
    centerY: number,
    worldWidth: number,
    worldHeight: number,
  ): CameraPoint {
    if (this.panBounds === "viewport" || !this.panInteractionActive) {
      return this.clampToViewport(
        centerX,
        centerY,
        worldWidth,
        worldHeight,
      );
    }
    return {
      x: Math.min(Math.max(0, worldWidth), Math.max(0, centerX)),
      y: Math.min(Math.max(0, worldHeight), Math.max(0, centerY)),
    };
  }

  private clampToViewport(
    centerX: number,
    centerY: number,
    worldWidth: number,
    worldHeight: number,
  ): CameraPoint {
    const visibleWidth = this.viewportWidth / this.tileScreenSize;
    const visibleHeight = this.viewportHeight / this.tileScreenSize;
    return {
      x: clampViewportAxis(centerX, worldWidth, visibleWidth),
      y: clampViewportAxis(centerY, worldHeight, visibleHeight),
    };
  }
}

function positiveFinite(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;
}

function nonNegativeFinite(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && Number(value) >= 0 ? Number(value) : fallback;
}

function clampViewportAxis(
  center: number,
  worldSize: number,
  visibleSize: number,
): number {
  if (worldSize <= visibleSize) return worldSize / 2;
  return Math.min(
    worldSize - visibleSize / 2,
    Math.max(visibleSize / 2, center),
  );
}
