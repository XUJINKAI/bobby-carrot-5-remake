import type { Game } from "../core/Game.js";
import type { Direction } from "../mechanics/ids.js";
import {
  ScreenJoystick,
  type ScreenJoystickOptions,
} from "./ScreenJoystick.js";

interface PointerState {
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
}

export interface InputControllerOptions {
  keyboard?: boolean;
  pointer?: boolean;
  movement?: boolean;
  undo?: boolean;
  restart?: boolean;
  pan?: boolean;
  zoom?: boolean;
  debug?: boolean;
  screenJoystick?: boolean | ScreenJoystickOptions;
  /** @deprecated 使用 `undo`。保留该字段只为兼容现有调用。 */
  allowUndo?: boolean;
}

interface InputCapabilities {
  keyboard: boolean;
  pointer: boolean;
  movement: boolean;
  undo: boolean;
  restart: boolean;
  pan: boolean;
  zoom: boolean;
  debug: boolean;
}

const KEY_DIRECTION: Record<string, Direction> = {
  arrowup: "up",
  w: "up",
  arrowdown: "down",
  s: "down",
  arrowleft: "left",
  a: "left",
  arrowright: "right",
  d: "right",
};

/**
 * 通用 Gameplay 输入适配器。
 *
 * Controller 负责把浏览器输入和外部方向控件翻译成 Game 动作；
 * Game 本身只认识移动、撤回、重开、相机等语义动作，不认识键盘或摇杆 DOM。
 */
export class InputController {
  private readonly game: Game;
  private readonly canvas: HTMLCanvasElement;
  private readonly capabilities: InputCapabilities;
  private readonly pointers = new Map<number, PointerState>();
  private readonly heldMovementKeys: string[] = [];
  private readonly screenJoystick: ScreenJoystick | null;
  private externalDirection: Direction | null = null;
  private joystickDirection: Direction | null = null;
  private pinchStartDistance = 0;
  private pinchStartZoom = 1;
  private suppressNextClick = false;
  private enabled = true;

  constructor(game: Game, options: InputControllerOptions = {}) {
    this.game = game;
    this.canvas = game.renderer.canvas;
    this.capabilities = {
      keyboard: options.keyboard ?? true,
      pointer: options.pointer ?? true,
      movement: options.movement ?? true,
      undo: options.undo ?? options.allowUndo ?? true,
      restart: options.restart ?? true,
      pan: options.pan ?? true,
      zoom: options.zoom ?? true,
      debug: options.debug ?? true,
    };
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
    window.addEventListener("blur", this.onBlur);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.canvas.addEventListener("auxclick", this.onAuxClick);
    const joystick = options.screenJoystick;
    this.screenJoystick =
      joystick === undefined || joystick === false
        ? null
        : new ScreenJoystick(
            this.canvas,
            joystick === true ? {} : joystick,
            this.setJoystickDirection,
          );
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    this.screenJoystick?.setInteractionEnabled(value);
    if (!value) this.clearHeldMovement();
  }

  setScreenJoystickEnabled(value: boolean): void {
    this.screenJoystick?.setEnabled(value);
  }

  /** 供 ScreenJoystick 和宿主方向输入复用同一条移动输入路径。 */
  setHeldDirection(direction: Direction | null): void {
    if (!this.enabled || !this.capabilities.movement) {
      this.externalDirection = null;
      this.applyHeldDirection();
      return;
    }
    this.externalDirection = direction;
    this.applyHeldDirection();
  }

  consumePointerClickSuppression(): boolean {
    const value = this.suppressNextClick;
    this.suppressNextClick = false;
    return value;
  }

  destroy(): void {
    this.clearHeldMovement();
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("auxclick", this.onAuxClick);
    this.screenJoystick?.destroy();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled || !this.capabilities.keyboard || !this.game.hasLevel)
      return;
    const key = event.key.toLowerCase();
    const direction = KEY_DIRECTION[key];
    if (direction && this.capabilities.movement) {
      event.preventDefault();
      if (!event.repeat && !this.heldMovementKeys.includes(key))
        this.heldMovementKeys.push(key);
      this.applyHeldDirection();
      return;
    }
    if (event.repeat) return;
    if (key === "r" && this.capabilities.restart) this.game.restart();
    else if ((key === "z" || key === "u") && this.capabilities.undo)
      this.game.undo();
    else if ((key === "=" || key === "+") && this.capabilities.zoom)
      this.game.zoomBy(1.1);
    else if ((key === "-" || key === "_") && this.capabilities.zoom)
      this.game.zoomBy(1 / 1.1);
    else if (
      this.capabilities.debug &&
      (event.code === "Backquote" || key === "`" || key === "~")
    )
      this.game.toggleDebug();
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (!this.capabilities.keyboard) return;
    const key = event.key.toLowerCase();
    if (!KEY_DIRECTION[key] || !this.capabilities.movement) return;
    event.preventDefault();
    const index = this.heldMovementKeys.lastIndexOf(key);
    if (index >= 0) this.heldMovementKeys.splice(index, 1);
    this.applyHeldDirection();
  };

  private readonly onBlur = (): void => {
    this.screenJoystick?.reset();
    this.clearHeldMovement();
  };

  private clearHeldMovement(): void {
    this.heldMovementKeys.length = 0;
    this.externalDirection = null;
    this.joystickDirection = null;
    this.game.setHeldDirection(null);
  }

  private applyHeldDirection(): void {
    this.game.setHeldDirection(
      this.joystickDirection ??
        this.externalDirection ??
        this.currentKeyboardDirection(),
    );
  }

  private readonly setJoystickDirection = (direction: Direction | null): void => {
    this.joystickDirection = direction;
    this.applyHeldDirection();
  };

  private currentKeyboardDirection(): Direction | null {
    const key = this.heldMovementKeys[this.heldMovementKeys.length - 1];
    return key ? (KEY_DIRECTION[key] ?? null) : null;
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (
      !this.enabled ||
      !this.capabilities.pointer ||
      (!this.capabilities.pan && !this.capabilities.zoom)
    )
      return;
    if (
      event.pointerType === "mouse" &&
      event.button !== 0 &&
      event.button !== 1
    )
      return;
    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    });
    if (this.capabilities.zoom && this.pointers.size === 2) {
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
    if (Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY) >= 4)
      pointer.moved = true;

    if (
      this.capabilities.zoom &&
      this.pointers.size === 2 &&
      this.pinchStartDistance > 0
    ) {
      this.game.setZoom(
        this.pinchStartZoom *
          (this.pointerDistance() / this.pinchStartDistance),
      );
      return;
    }
    if (
      this.capabilities.pan &&
      this.pointers.size === 1 &&
      (dx !== 0 || dy !== 0)
    )
      this.game.panByScreen(dx, dy);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const pointer = this.pointers.get(event.pointerId);
    const wasPinching = this.pointers.size >= 2;
    this.pointers.delete(event.pointerId);
    const mayProduceClick = event.pointerType !== "mouse" || event.button === 0;
    if (mayProduceClick && (pointer?.moved || wasPinching))
      this.suppressNextClick = true;
    if (this.pointers.size < 2) this.pinchStartDistance = 0;
    for (const remaining of this.pointers.values()) {
      remaining.startX = remaining.x;
      remaining.startY = remaining.y;
      remaining.moved = false;
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (
      !this.enabled ||
      !this.capabilities.pointer ||
      !this.capabilities.zoom
    )
      return;
    event.preventDefault();
    this.game.zoomBy(event.deltaY < 0 ? 1.08 : 1 / 1.08);
  };

  private readonly onAuxClick = (event: MouseEvent): void => {
    if (event.button === 1 && this.capabilities.pan) event.preventDefault();
  };

  private pointerDistance(): number {
    const values = [...this.pointers.values()];
    const a = values[0];
    const b = values[1];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
