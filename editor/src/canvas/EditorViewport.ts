export interface EditorViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2.75;

export class EditorViewport {
  private state: EditorViewportState = { zoom: 1, panX: 0, panY: 0 };

  get snapshot(): Readonly<EditorViewportState> {
    return { ...this.state };
  }

  reset(): void {
    this.state = { zoom: 1, panX: 0, panY: 0 };
  }

  fitInitial(
    viewportWidth: number,
    viewportHeight: number,
    contentWidth: number,
    contentHeight: number,
    padding = 0,
  ): void {
    const availableWidth = Math.max(1, viewportWidth - padding * 2);
    const availableHeight = Math.max(1, viewportHeight - padding * 2);
    const fit = Math.min(
      1,
      availableWidth / Math.max(1, contentWidth),
      availableHeight / Math.max(1, contentHeight),
    );
    const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, fit));
    this.state = {
      zoom,
      panX: Math.max(0, (availableWidth - contentWidth * zoom) / 2),
      panY: Math.max(0, (availableHeight - contentHeight * zoom) / 2),
    };
  }

  panBy(dx: number, dy: number): void {
    this.state.panX += dx;
    this.state.panY += dy;
  }

  zoomAt(factor: number, clientX: number, clientY: number): void {
    const previous = this.state.zoom;
    const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, previous * factor));
    if (zoom === previous) return;
    const ratio = zoom / previous;
    this.state.panX = clientX - (clientX - this.state.panX) * ratio;
    this.state.panY = clientY - (clientY - this.state.panY) * ratio;
    this.state.zoom = zoom;
  }
}
