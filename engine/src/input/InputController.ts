import type { Game } from '../core/Game.js';
import type { Direction } from '../mechanics/registry.js';

interface PointerState {
  x: number;
  y: number;
  startX: number;
  startY: number;
}

export class InputController {
  private readonly game: Game;
  private readonly canvas: HTMLCanvasElement;
  private readonly pointers = new Map<number, PointerState>();
  private pinchStartDistance = 0;
  private pinchStartZoom = 1;
  private enabled = true;

  constructor(game: Game) {
    this.game = game;
    this.canvas = game.renderer.canvas;
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  setEnabled(value: boolean): void { this.enabled = value; }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled || !this.game.hasLevel) return;
    const key = event.key.toLowerCase();
    const movement: Record<string, Direction> = {
      arrowup: 'up', w: 'up',
      arrowdown: 'down', s: 'down',
      arrowleft: 'left', a: 'left',
      arrowright: 'right', d: 'right'
    };
    const direction = movement[key];
    if (direction) {
      event.preventDefault();
      this.game.move(direction);
      return;
    }
    if (key === 'r') this.game.restart();
    else if (key === 'z' || key === 'u') this.game.undo();
    else if (key === '=' || key === '+') this.game.zoomBy(1.1);
    else if (key === '-' || key === '_') this.game.zoomBy(1 / 1.1);
    else if (key === 'f2') this.game.toggleDebug();
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return;
    this.canvas.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
    if (this.pointers.size === 2) {
      this.pinchStartDistance = this.pointerDistance();
      this.pinchStartZoom = this.game.zoom;
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (this.pointers.size === 2 && this.pinchStartDistance > 0) {
      const distance = this.pointerDistance();
      this.game.setZoom(this.pinchStartZoom * (distance / this.pinchStartDistance));
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const pointer = this.pointers.get(event.pointerId);
    const wasPinching = this.pointers.size >= 2;
    this.pointers.delete(event.pointerId);
    if (!pointer || wasPinching || !this.enabled || !this.game.hasLevel) return;

    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    const distance = Math.hypot(dx, dy);
    if (distance < 24) return;
    const direction: Direction = Math.abs(dx) > Math.abs(dy)
      ? (dx < 0 ? 'left' : 'right')
      : (dy < 0 ? 'up' : 'down');
    this.game.move(direction);
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();
    this.game.zoomBy(event.deltaY < 0 ? 1.08 : 1 / 1.08);
  };

  private pointerDistance(): number {
    const values = [...this.pointers.values()];
    const a = values[0];
    const b = values[1];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
