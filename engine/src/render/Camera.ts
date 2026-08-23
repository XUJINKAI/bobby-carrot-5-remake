export interface CameraPoint { x: number; y: number; }

export class Camera {
  centerX = 0;
  centerY = 0;
  viewportWidth = 1;
  viewportHeight = 1;
  zoom = 1;
  readonly sourceTileSize: number;

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

  follow(point: CameraPoint, worldWidth: number, worldHeight: number): void {
    // 现代版相机直接追踪平滑插值后的角色坐标，因此不会随逻辑格瞬移。
    this.centerX = point.x + 0.5;
    this.centerY = point.y + 0.5;
    this.clamp(worldWidth, worldHeight);
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
