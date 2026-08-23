export interface CameraPoint { x: number; y: number; }

export class Camera {
  centerX = 0;
  centerY = 0;
  viewportWidth = 1;
  viewportHeight = 1;
  zoom = 1;
  readonly sourceTileSize: number;
  private panOffsetX = 0;
  private panOffsetY = 0;

  constructor(sourceTileSize = 48) {
    this.sourceTileSize = sourceTileSize;
  }

  get tileScreenSize(): number { return this.sourceTileSize * this.zoom; }

  setViewport(width: number, height: number): void {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
  }

  setZoom(value: number): void {
    this.zoom = Math.min(2.75, Math.max(0.3, value));
  }

  resetPan(): void {
    this.panOffsetX = 0;
    this.panOffsetY = 0;
  }

  panByScreen(dx: number, dy: number): void {
    const size = this.tileScreenSize;
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || size <= 0) return;
    this.panOffsetX -= dx / size;
    this.panOffsetY -= dy / size;
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
      x: (x - this.centerX) * size + this.viewportWidth / 2,
      y: (y - this.centerY) * size + this.viewportHeight / 2
    };
  }

  screenToTile(screenX: number, screenY: number): CameraPoint {
    const size = this.tileScreenSize;
    return {
      x: Math.floor((screenX - this.viewportWidth / 2) / size + this.centerX),
      y: Math.floor((screenY - this.viewportHeight / 2) / size + this.centerY)
    };
  }

  private clamp(worldWidth: number, worldHeight: number): void {
    const visibleWidth = this.viewportWidth / this.tileScreenSize;
    const visibleHeight = this.viewportHeight / this.tileScreenSize;
    if (worldWidth <= visibleWidth) this.centerX = worldWidth / 2;
    else this.centerX = Math.min(worldWidth - visibleWidth / 2, Math.max(visibleWidth / 2, this.centerX));
    if (worldHeight <= visibleHeight) this.centerY = worldHeight / 2;
    else this.centerY = Math.min(worldHeight - visibleHeight / 2, Math.max(visibleHeight / 2, this.centerY));
  }
}
