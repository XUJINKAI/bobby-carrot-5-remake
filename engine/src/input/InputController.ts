import type { Game } from '../core/Game.js';
import type { Direction } from '../mechanics/ids.js';

interface PointerState {
  x: number;
  y: number;
  startX: number;
  startY: number;
}

const KEY_DIRECTION: Record<string, Direction> = {
  arrowup: 'up', w: 'up',
  arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left',
  arrowright: 'right', d: 'right'
};

/**
 * 输入控制器只维护“此刻”的玩家意图，不生成移动指令队列。
 *
 * 原版移动循环持续读取按键状态：键抬起后，完成当前格就停；不会因为浏览器 key-repeat
 * 已经投递了若干 keydown 而继续跑很多格。冰面/跑道/荷叶等强制运动仍由 Engine 自己续步。
 */
export class InputController {
  private readonly game: Game;
  private readonly canvas: HTMLCanvasElement;
  private readonly pointers = new Map<number, PointerState>();
  private readonly heldMovementKeys: string[] = [];
  private pinchStartDistance = 0;
  private pinchStartZoom = 1;
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
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    if (!value) this.clearHeldMovement();
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
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled || !this.game.hasLevel) return;
    const key = event.key.toLowerCase();
    const direction = KEY_DIRECTION[key];
    if (direction) {
      event.preventDefault();
      // 浏览器 key-repeat 不应制造逻辑步数。只在物理按键首次按下时更新优先级。
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
    // Swipe 是一次离散动作，不建立持续持键状态。
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
