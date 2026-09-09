import type { PresentationFrame } from "../time/PresentationClock.js";

export interface CameraPoint {
  x: number;
  y: number;
}

export interface CameraOptions {
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

export const DEFAULT_CAMERA_OPTIONS: Readonly<Required<CameraOptions>> = {
  zoom: 1,
  minZoom: .25,
  maxZoom: 4,
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
  private shakeState: CameraShake | null = null;
  private shakeOffsetX = 0;
  private shakeOffsetY = 0;

  constructor(sourceTileSize = 48, options: CameraOptions = {}) {
    this.sourceTileSize = sourceTileSize;
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

  resetPan(): void {
    this.panOffsetX = 0;
    this.panOffsetY = 0;
    this.panReturn = null;
  }

  panByScreen(dx: number, dy: number): void {
    const size = this.tileScreenSize;
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || size <= 0) return;
    this.panReturn = null;
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

  follow(point: CameraPoint, worldWidth: number, worldHeight: number): void {
    const baseX = point.x + 0.5;
    const baseY = point.y + 0.5;
    this.centerX = baseX + this.panOffsetX;
    this.centerY = baseY + this.panOffsetY;
    this.clamp(worldWidth, worldHeight);
    this.panOffsetX = this.centerX - baseX;
    this.panOffsetY = this.centerY - baseY;
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
    const size = this.tileScreenSize;
    return {
      x: Math.floor(
        (screenX - this.shakeOffsetX - this.viewportWidth / 2) / size +
          this.centerX,
      ),
      y: Math.floor(
        (screenY - this.shakeOffsetY - this.viewportHeight / 2) / size +
          this.centerY,
      ),
    };
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
      this.panOffsetX = 0;
      this.panOffsetY = 0;
      this.panReturn = null;
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

  private clamp(worldWidth: number, worldHeight: number): void {
    const visibleWidth = this.viewportWidth / this.tileScreenSize;
    const visibleHeight = this.viewportHeight / this.tileScreenSize;
    if (worldWidth <= visibleWidth) this.centerX = worldWidth / 2;
    else
      this.centerX = Math.min(
        worldWidth - visibleWidth / 2,
        Math.max(visibleWidth / 2, this.centerX),
      );
    if (worldHeight <= visibleHeight) this.centerY = worldHeight / 2;
    else
      this.centerY = Math.min(
        worldHeight - visibleHeight / 2,
        Math.max(visibleHeight / 2, this.centerY),
      );
  }
}

function positiveFinite(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;
}
