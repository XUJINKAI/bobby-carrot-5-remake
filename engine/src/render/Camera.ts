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
  panBounds?: CameraPanBounds;
}

export const DEFAULT_CAMERA_OPTIONS: Readonly<Required<CameraOptions>> = {
  zoom: 1,
  minZoom: .25,
  maxZoom: 4,
  panBounds: "viewport",
} as const;

/** 原版 Camera 聚焦移动的最高速度为 24 source px/step。 */
export const CAMERA_FOLLOW_MAX_SPEED_SOURCE_PX_PER_STEP = 24;
/** Engine Camera 每个逻辑步共用的加减速幅度。 */
export const CAMERA_FOLLOW_ACCELERATION_SOURCE_PX_PER_STEP = 2;
/** 与原版实测 416ms/16-step 慢速移动共用同一 gameplay 循环墙钟。 */
export const CAMERA_FOLLOW_STEP_MS = 26;

interface PanReturn {
  fromX: number;
  fromY: number;
  startedAtMs: number;
  durationMs: number;
}

interface CameraShake {
  mode: "smooth" | "stepped";
  startedAtMs: number;
  durationMs: number;
  amplitudeSourcePx: number;
  stageMs?: number;
  stages?: number;
}

interface FollowTransition {
  fromX: number;
  fromY: number;
  startedAtMs: number;
}

const FOLLOW_JUMP_THRESHOLD_CELLS = 0.5;

export class Camera {
  centerX = 0;
  centerY = 0;
  viewportWidth = 1;
  viewportHeight = 1;
  readonly sourceTileSize: number;
  private minZoom: number = DEFAULT_CAMERA_OPTIONS.minZoom;
  private maxZoom: number = DEFAULT_CAMERA_OPTIONS.maxZoom;
  private requestedZoom: number = DEFAULT_CAMERA_OPTIONS.zoom;
  private framingZoom: number | null = null;
  private panOffsetX = 0;
  private panOffsetY = 0;
  /** 保留最近一次回中 tween，便于 Debug Presentation 倒一帧。 */
  private panReturn: PanReturn | null = null;
  private followedX: number | null = null;
  private followedY: number | null = null;
  private followedWorldWidth = 0;
  private followedWorldHeight = 0;
  private followTransition: FollowTransition | null = null;
  private readonly panBounds: CameraPanBounds;
  private panInteractionActive = false;
  private shakeState: CameraShake | null = null;
  private shakeOffsetX = 0;
  private shakeOffsetY = 0;

  constructor(sourceTileSize = 48, options: CameraOptions = {}) {
    this.sourceTileSize = sourceTileSize;
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

  /** 多目标构图可以暂时突破 minZoom，但不会改变用户请求的 zoom。 */
  get zoom(): number {
    return Math.min(this.requestedZoom, this.framingZoom ?? Number.POSITIVE_INFINITY);
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
    this.requestedZoom = Math.min(
      this.maxZoom,
      Math.max(this.minZoom, this.requestedZoom),
    );
  }

  setZoom(value: number): void {
    this.requestedZoom = Math.min(this.maxZoom, Math.max(this.minZoom, value));
  }

  zoomBy(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) return;
    this.setZoom(this.requestedZoom * factor);
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
    this.framingZoom = null;
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
      mode: "smooth",
      startedAtMs: frame.nowMs,
      durationMs: Math.max(0, durationMs),
      amplitudeSourcePx: Math.max(0, amplitudeSourcePx),
    };
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  /** 原版 impact 按离散阶段更新随机窗口，采样仍由 PresentationClock 驱动。 */
  shakeStepped(
    frame: PresentationFrame,
    stageMs: number,
    stages: number,
    initialSpanSourcePx: number,
  ): void {
    const safeStageMs = Math.max(0, Number.isFinite(stageMs) ? stageMs : 0);
    const safeStages = Math.max(
      1,
      Number.isFinite(stages) ? Math.floor(stages) : 1,
    );
    this.shakeState = {
      mode: "stepped",
      startedAtMs: frame.nowMs,
      durationMs: safeStageMs * safeStages,
      amplitudeSourcePx: Math.max(
        0,
        Number.isFinite(initialSpanSourcePx) ? initialSpanSourcePx : 0,
      ),
      stageMs: safeStageMs,
      stages: safeStages,
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
    this.framingZoom = null;
    this.followPoint(point, worldWidth, worldHeight, frame);
  }

  /** 以完整格边界构图；必要时允许 zoom 低于配置下限以容纳所有目标。 */
  followPoints(
    points: readonly CameraPoint[],
    worldWidth: number,
    worldHeight: number,
    frame?: PresentationFrame,
  ): void {
    if (points.length === 0) return;
    if (points.length === 1) {
      this.follow(points[0]!, worldWidth, worldHeight, frame);
      return;
    }
    const minX = Math.max(0, Math.min(...points.map((point) => point.x)) - 0.5);
    const minY = Math.max(0, Math.min(...points.map((point) => point.y)) - 0.5);
    const maxX = Math.min(
      worldWidth,
      Math.max(...points.map((point) => point.x + 1)) + 0.5,
    );
    const maxY = Math.min(
      worldHeight,
      Math.max(...points.map((point) => point.y + 1)) + 0.5,
    );
    const fitZoom = Math.min(
      this.viewportWidth / (Math.max(1, maxX - minX) * this.sourceTileSize),
      this.viewportHeight / (Math.max(1, maxY - minY) * this.sourceTileSize),
    );
    this.framingZoom = positiveFinite(fitZoom, this.requestedZoom);
    this.resetPan();
    this.followPoint(
      { x: (minX + maxX) / 2 - 0.5, y: (minY + maxY) / 2 - 0.5 },
      worldWidth,
      worldHeight,
      frame,
    );
  }

  private followPoint(
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
    if (targetJumped && frame) {
      this.followTransition = {
        fromX: this.centerX,
        fromY: this.centerY,
        startedAtMs: frame.nowMs,
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

    const steps = Math.max(
      0,
      Math.floor((frame.nowMs - transition.startedAtMs) / CAMERA_FOLLOW_STEP_MS),
    );
    const position = cameraFollowPosition(
      transition.fromX,
      transition.fromY,
      desired.x,
      desired.y,
      this.sourceTileSize,
      steps,
    );
    this.centerX = position.x;
    this.centerY = position.y;
    if (this.centerX === desired.x && this.centerY === desired.y)
      this.followTransition = null;
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
    if (shake.mode === "stepped") {
      this.updateSteppedShake(shake, elapsedMs);
      return;
    }
    const amplitude = shake.amplitudeSourcePx * this.zoom * (1 - raw);
    // Deterministic presentation-time oscillation keeps Debug rewind reproducible.
    this.shakeOffsetX = Math.sin(elapsedMs * 0.115) * amplitude;
    this.shakeOffsetY = Math.sin(elapsedMs * 0.173 + 1.2) * amplitude * 0.72;
  }

  private updateSteppedShake(shake: CameraShake, elapsedMs: number): void {
    const stages = shake.stages ?? 1;
    const stageMs = shake.stageMs ?? shake.durationMs;
    const stage = stageMs <= 0
      ? stages - 1
      : Math.min(stages - 1, Math.floor(elapsedMs / stageMs));
    const remaining = stages - 1 - stage;
    const span = stages <= 1
      ? 0
      : Math.round(shake.amplitudeSourcePx * remaining / (stages - 1));
    this.shakeOffsetX = steppedShakeOffset(stage, 0, span) * this.zoom;
    this.shakeOffsetY = steppedShakeOffset(stage, 1, span) * this.zoom;
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

function steppedShakeOffset(stage: number, axis: number, span: number): number {
  if (span <= 0) return 0;
  let hash = Math.imul(stage + 1, 0x45d9f3b) ^ Math.imul(axis + 7, 0x119de1f3);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x45d9f3b);
  hash ^= hash >>> 16;
  const sample = (hash >>> 0) / 0x1_0000_0000;
  return Math.floor(sample * (span + 1)) - (span >> 1);
}

/**
 * 计算原版全局 Camera 速度曲线经过指定步数后的位置。
 *
 * `stoppingDistance` 对应逆向字段 bS / bT；接近目标时使用同一套状态逐步减速，
 * 因此近距离聚焦不会套用固定时长，远距离聚焦也不会瞬间掠过地图。
 */
export function cameraFollowAxisPosition(
  from: number,
  target: number,
  sourceTileSize: number,
  steps: number,
): number {
  const deltaSourcePx = (target - from) * sourceTileSize;
  const direction = Math.sign(deltaSourcePx);
  let remaining = Math.abs(deltaSourcePx);
  let speed = 0;
  let stoppingDistance = 0;
  let moved = 0;
  const safeSteps = Math.max(0, Math.floor(steps));
  for (let step = 0; step < safeSteps && remaining > 0; step += 1) {
    if (remaining > stoppingDistance + speed) {
      if (speed < CAMERA_FOLLOW_MAX_SPEED_SOURCE_PX_PER_STEP) {
        speed = Math.min(
          CAMERA_FOLLOW_MAX_SPEED_SOURCE_PX_PER_STEP,
          speed + CAMERA_FOLLOW_ACCELERATION_SOURCE_PX_PER_STEP,
        );
        stoppingDistance += speed;
      }
    } else if (remaining < stoppingDistance + speed && speed > 1) {
      stoppingDistance -= speed;
      speed = Math.max(
        1,
        speed - CAMERA_FOLLOW_ACCELERATION_SOURCE_PX_PER_STEP,
      );
    }
    speed = Math.min(speed, remaining);
    remaining -= speed;
    moved += speed;
  }
  if (remaining <= 0) return target;
  return from + direction * moved / sourceTileSize;
}

/** 较长轴驱动统一进度，避免两轴独立减速形成先斜后直的折线路径。 */
function cameraFollowPosition(
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  sourceTileSize: number,
  steps: number,
): CameraPoint {
  const deltaX = targetX - fromX;
  const deltaY = targetY - fromY;
  const dominantDistance = Math.max(
    Math.abs(deltaX),
    Math.abs(deltaY),
  );
  if (dominantDistance === 0) return { x: targetX, y: targetY };
  const dominantPosition = cameraFollowAxisPosition(
    0,
    dominantDistance,
    sourceTileSize,
    steps,
  );
  const progress = dominantPosition / dominantDistance;
  return {
    x: progress >= 1 ? targetX : fromX + deltaX * progress,
    y: progress >= 1 ? targetY : fromY + deltaY * progress,
  };
}

/** World 侧只使用确定性的聚焦路程预算，不读取 Presentation Camera 状态。 */
export function cameraFollowTravelDurationMs(
  deltaXSourcePx: number,
  deltaYSourcePx: number,
): number {
  return Math.max(
    cameraFollowTravelSteps(deltaXSourcePx),
    cameraFollowTravelSteps(deltaYSourcePx),
  ) * CAMERA_FOLLOW_STEP_MS;
}

function cameraFollowTravelSteps(deltaSourcePx: number): number {
  let remaining = Math.abs(deltaSourcePx);
  if (remaining <= 0) return 0;
  let speed = 0;
  let stoppingDistance = 0;
  let steps = 0;
  while (remaining > 0) {
    if (remaining > stoppingDistance + speed) {
      if (speed < CAMERA_FOLLOW_MAX_SPEED_SOURCE_PX_PER_STEP) {
        speed = Math.min(
          CAMERA_FOLLOW_MAX_SPEED_SOURCE_PX_PER_STEP,
          speed + CAMERA_FOLLOW_ACCELERATION_SOURCE_PX_PER_STEP,
        );
        stoppingDistance += speed;
      }
    } else if (remaining < stoppingDistance + speed && speed > 1) {
      stoppingDistance -= speed;
      speed = Math.max(
        1,
        speed - CAMERA_FOLLOW_ACCELERATION_SOURCE_PX_PER_STEP,
      );
    }
    speed = Math.min(speed, remaining);
    remaining -= speed;
    steps += 1;
  }
  return steps;
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
