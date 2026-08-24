import type { Game } from '../core/Game.js';
import type { Direction } from '../mechanics/ids.js';

interface PointerState {
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
}

const KEY_DIRECTION: Record<string, Direction> = {
  arrowup: 'up', w: 'up',
  arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left',
  arrowright: 'right', d: 'right'
};

/** 输入层只表达当前意图：键盘/移动端方向键负责移动，画布拖动只负责相机。 */
export class InputController {
  private readonly game: Game;
  private readonly canvas: HTMLCanvasElement;
  private readonly pointers = new Map<number, PointerState>();
  private readonly heldMovementKeys: string[] = [];
  private pinchStartDistance = 0;
  private pinchStartZoom = 1;
  private suppressNextClick = false;
  private enabled = true;

  constructor(game: Game) {
    this.game = game;
    this.canvas = game.renderer.canvas;
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp, { passive: false });
    window.addEventListener('blur', this.onBlur);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvas.addEventListener('auxclick', this.onAuxClick);
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    if (!value) this.clearHeldMovement();
  }

  consumePointerClickSuppression(): boolean {
    const value = this.suppressNextClick;
    this.suppressNextClick = false;
    return value;
  }

  destroy(): void {
    this.clearHeldMovement();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('auxclick', this.onAuxClick);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled || !this.game.hasLevel) return;
    const key = event.key.toLowerCase();
    const direction = KEY_DIRECTION[key];
    if (direction) {
      event.preventDefault();
      if (!event.repeat && !this.heldMovementKeys.includes(key)) this.heldMovementKeys.push(key);
      this.game.setHeldDirection(this.currentHeldDirection());
      return;
    }
    if (event.repeat) return;
    if (key === 'r') this.game.restart();
    else if (key === 'z' || key === 'u') this.game.undo();
    else if (key === '=' || key === '+') this.game.zoomBy(1.1);
    else if (key === '-' || key === '_') this.game.zoomBy(1 / 1.1);
    else if (event.code === 'Backquote' || key === '`' || key === '~') this.game.toggleDebug();
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (!KEY_DIRECTION[key]) return;
    event.preventDefault();
    const index = this.heldMovementKeys.lastIndexOf(key);
    if (index >= 0) this.heldMovementKeys.splice(index, 1);
    this.game.setHeldDirection(this.currentHeldDirection());
  };

  private readonly onBlur = (): void => this.clearHeldMovement();

  private clearHeldMovement(): void {
    this.heldMovementKeys.length = 0;
    this.game.setHeldDirection(null);
  }

  private currentHeldDirection(): Direction | null {
    const key = this.heldMovementKeys[this.heldMovementKeys.length - 1];
    return key ? KEY_DIRECTION[key] ?? null : null;
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return;
    if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, {
      x: event.clientX, y: event.clientY,
      startX: event.clientX, startY: event.clientY,
      moved: false
    });
    if (this.pointers.size === 2) {
      this.pinchStartDistance = this.pointerDistance();
      this.pinchStartZoom = this.game.zoom;
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY) >= 4) pointer.moved = true;

    if (this.pointers.size === 2 && this.pinchStartDistance > 0) {
      this.game.setZoom(this.pinchStartZoom * (this.pointerDistance() / this.pinchStartDistance));
      return;
    }
    if (this.pointers.size === 1 && (dx !== 0 || dy !== 0)) this.game.panByScreen(dx, dy);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const pointer = this.pointers.get(event.pointerId);
    const wasPinching = this.pointers.size >= 2;
    this.pointers.delete(event.pointerId);
    // 只有会产生后续 click 的左键/触摸拖动需要抑制 click；中键结束只会触发 auxclick。
    const mayProduceClick = event.pointerType !== 'mouse' || event.button === 0;
    if (mayProduceClick && (pointer?.moved || wasPinching)) this.suppressNextClick = true;
    if (this.pointers.size < 2) this.pinchStartDistance = 0;
    for (const remaining of this.pointers.values()) {
      remaining.startX = remaining.x;
      remaining.startY = remaining.y;
      remaining.moved = false;
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();
    this.game.zoomBy(event.deltaY < 0 ? 1.08 : 1 / 1.08);
  };

  private readonly onAuxClick = (event: MouseEvent): void => {
    if (event.button === 1) event.preventDefault();
  };

  private pointerDistance(): number {
    const values = [...this.pointers.values()];
    const a = values[0];
    const b = values[1];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
