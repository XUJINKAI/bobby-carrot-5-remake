import type { Direction } from "@bobby/model";
import type { Game } from "../core/Game.js";
import type { WorldTick } from "../time/WorldClock.js";
import {
  HeldDirectionRepeater,
  type HeldDirectionInput,
  type HeldMoveAttempt,
} from "./HeldDirectionRepeater.js";
import {
  DEFAULT_SCREEN_JOYSTICK_OPTIONS,
  ScreenJoystick,
  type ScreenJoystickOptions,
} from "./ScreenJoystick.js";

interface PointerState {
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
  discreteMoveIssued: boolean;
  panPointer: boolean;
}

export interface InputControllerOptions {
  keyboard?: boolean;
  pointer?: boolean;
  movement?: boolean;
  undo?: boolean;
  redo?: boolean;
  restart?: boolean;
  pan?: boolean;
  zoom?: boolean;
  debug?: boolean;
  screenJoystick?: boolean | ScreenJoystickOptions;
  keyboardRepeatDelayMs?: number;
  externalRepeatDelayMs?: number;
}

export interface LogicalMoveInput {
  source: string;
  direction: Direction;
}

export interface InputState {
  move: LogicalMoveInput | null;
}

interface InputCapabilities {
  keyboard: boolean;
  pointer: boolean;
  movement: boolean;
  undo: boolean;
  redo: boolean;
  restart: boolean;
  pan: boolean;
  zoom: boolean;
  debug: boolean;
}

export const DEFAULT_INPUT_CONTROLLER_OPTIONS = {
  keyboard: true,
  pointer: true,
  movement: true,
  undo: true,
  redo: true,
  restart: true,
  pan: true,
  zoom: true,
  debug: true,
  keyboardRepeatDelayMs: 250,
  externalRepeatDelayMs: 250,
} as const;

const KEY_INPUT: Readonly<Record<string, LogicalMoveInput>> = {
  arrowup: { source: "arrows", direction: "up" },
  arrowdown: { source: "arrows", direction: "down" },
  arrowleft: { source: "arrows", direction: "left" },
  arrowright: { source: "arrows", direction: "right" },
  w: { source: "wasd", direction: "up" },
  s: { source: "wasd", direction: "down" },
  a: { source: "wasd", direction: "left" },
  d: { source: "wasd", direction: "right" },
};

const DISCRETE_DRAG_THRESHOLD = 24;

export function directionForDiscreteDrag(
  dx: number,
  dy: number,
  threshold = DISCRETE_DRAG_THRESHOLD,
): Direction | null {
  if (Math.hypot(dx, dy) < threshold) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "up" : "down";
}

export class InputController {
  private readonly canvas: HTMLCanvasElement;
  private readonly capabilities: InputCapabilities;
  private readonly pointers = new Map<number, PointerState>();
  private readonly heldMovementKeys: string[] = [];
  private readonly discreteMoves: LogicalMoveInput[] = [];
  private readonly screenJoystick: ScreenJoystick | null;
  private readonly repeater = new HeldDirectionRepeater();
  private readonly keyboardRepeatDelayMs: number;
  private readonly joystickRepeatDelayMs: number;
  private readonly externalRepeatDelayMs: number;
  private pendingMoveSource: "continuous" | "discrete" | null = null;
  private continuousLogicalSource: string | null = null;
  private externalDirection: Direction | null = null;
  private joystickDirection: Direction | null = null;
  private pinchStartDistance = 0;
  private pinchStartZoom = 1;
  private suppressNextClick = false;
  private enabled = true;

  constructor(
    private readonly game: Game,
    options: InputControllerOptions = {},
  ) {
    this.canvas = game.canvas;
    this.capabilities = {
      keyboard: options.keyboard ?? DEFAULT_INPUT_CONTROLLER_OPTIONS.keyboard,
      pointer: options.pointer ?? DEFAULT_INPUT_CONTROLLER_OPTIONS.pointer,
      movement: options.movement ?? DEFAULT_INPUT_CONTROLLER_OPTIONS.movement,
      undo: options.undo ?? DEFAULT_INPUT_CONTROLLER_OPTIONS.undo,
      redo: options.redo ?? options.undo ?? DEFAULT_INPUT_CONTROLLER_OPTIONS.redo,
      restart: options.restart ?? DEFAULT_INPUT_CONTROLLER_OPTIONS.restart,
      pan: options.pan ?? DEFAULT_INPUT_CONTROLLER_OPTIONS.pan,
      zoom: options.zoom ?? DEFAULT_INPUT_CONTROLLER_OPTIONS.zoom,
      debug: options.debug ?? DEFAULT_INPUT_CONTROLLER_OPTIONS.debug,
    };
    this.keyboardRepeatDelayMs = Math.max(
      0,
      options.keyboardRepeatDelayMs ?? DEFAULT_INPUT_CONTROLLER_OPTIONS.keyboardRepeatDelayMs,
    );
    this.externalRepeatDelayMs = Math.max(
      0,
      options.externalRepeatDelayMs ?? DEFAULT_INPUT_CONTROLLER_OPTIONS.externalRepeatDelayMs,
    );

    const joystick = options.screenJoystick;
    const joystickOptions = joystick && joystick !== true ? joystick : undefined;
    this.joystickRepeatDelayMs = Math.max(
      0,
      joystickOptions?.initialRepeatDelayMs ?? DEFAULT_SCREEN_JOYSTICK_OPTIONS.initialRepeatDelayMs,
    );

    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
    window.addEventListener("blur", this.onBlur);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.canvas.addEventListener("auxclick", this.onAuxClick);
    this.screenJoystick =
      joystick === undefined || joystick === false
        ? null
        : new ScreenJoystick(
            this.canvas,
            joystick === true ? {} : joystick,
            this.setJoystickDirection,
          );
  }

  /** 浏览器事件只维护状态；movement 同时保留逻辑 channel。 */
  update(time: WorldTick): InputState {
    if (!this.enabled || !this.capabilities.movement || !this.game.hasLevel) {
      this.clearMovementState();
      return { move: null };
    }
    if (this.pendingMoveSource) return { move: null };

    const discrete = this.discreteMoves.shift();
    if (discrete) {
      this.pendingMoveSource = "discrete";
      return { move: discrete };
    }

    const continuous = this.repeater.update(time.stepMs);
    if (continuous && this.continuousLogicalSource) {
      this.pendingMoveSource = "continuous";
      return {
        move: {
          source: this.continuousLogicalSource,
          direction: continuous,
        },
      };
    }
    return { move: null };
  }

  resolveMoveAttempt(result: HeldMoveAttempt): void {
    if (this.pendingMoveSource === "continuous") this.repeater.resolveAttempt(result);
    this.pendingMoveSource = null;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    this.screenJoystick?.setInteractionEnabled(value);
    if (!value) this.clearHeldMovement();
  }

  setKeyboardEnabled(value: boolean): void {
    this.capabilities.keyboard = value;
    if (!value) this.heldMovementKeys.length = 0;
    this.syncContinuousInput();
  }

  setScreenJoystickEnabled(value: boolean): void {
    this.screenJoystick?.setEnabled(value);
  }

  setHeldDirection(direction: Direction | null): void {
    if (!this.enabled || !this.capabilities.movement) {
      this.externalDirection = null;
      this.syncContinuousInput();
      return;
    }
    this.externalDirection = direction;
    this.syncContinuousInput();
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
    if (!this.enabled || !this.capabilities.keyboard || !this.game.hasLevel) return;
    const key = event.key.toLowerCase();
    const movement = KEY_INPUT[key];
    if (movement && this.capabilities.movement) {
      event.preventDefault();
      if (!event.repeat && !this.heldMovementKeys.includes(key)) {
        this.heldMovementKeys.push(key);
        this.syncContinuousInput();
      }
      return;
    }
    if (event.repeat) return;
    if (key === "r" && this.capabilities.restart) this.game.restart();
    else if (key === "z" && event.shiftKey && this.capabilities.redo) this.game.redo();
    else if ((key === "z" || key === "u") && this.capabilities.undo) this.game.undo();
    else if ((key === "=" || key === "+") && this.capabilities.zoom) this.game.zoomBy(1.1);
    else if ((key === "-" || key === "_") && this.capabilities.zoom) this.game.zoomBy(1 / 1.1);
    else if (
      this.capabilities.debug &&
      (event.code === "Backquote" || key === "`" || key === "~")
    )
      this.game.toggleDebug();
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (!this.capabilities.keyboard) return;
    const key = event.key.toLowerCase();
    if (!KEY_INPUT[key] || !this.capabilities.movement) return;
    event.preventDefault();
    const index = this.heldMovementKeys.lastIndexOf(key);
    if (index >= 0) {
      this.heldMovementKeys.splice(index, 1);
      this.syncContinuousInput();
    }
  };

  private readonly onBlur = (): void => {
    this.screenJoystick?.reset();
    this.clearHeldMovement();
  };

  private clearHeldMovement(): void {
    this.heldMovementKeys.length = 0;
    this.externalDirection = null;
    this.joystickDirection = null;
    this.clearMovementState();
  }

  private clearMovementState(): void {
    this.discreteMoves.length = 0;
    this.pendingMoveSource = null;
    this.continuousLogicalSource = null;
    this.repeater.reset();
  }

  private readonly setJoystickDirection = (direction: Direction | null): void => {
    this.joystickDirection = direction;
    this.syncContinuousInput();
  };

  private syncContinuousInput(): void {
    const input = this.currentContinuousInput();
    this.continuousLogicalSource = input?.source ?? null;
    this.repeater.setInput(input);
  }

  private currentContinuousInput(): HeldDirectionInput | null {
    if (this.joystickDirection) {
      return {
        source: "joystick",
        direction: this.joystickDirection,
        initialRepeatDelayMs: this.joystickRepeatDelayMs,
      };
    }
    if (this.externalDirection) {
      return {
        source: "external",
        direction: this.externalDirection,
        initialRepeatDelayMs: this.externalRepeatDelayMs,
      };
    }
    const keyboard = this.currentKeyboardInput();
    return keyboard
      ? {
          source: keyboard.source,
          direction: keyboard.direction,
          initialRepeatDelayMs: this.keyboardRepeatDelayMs,
        }
      : null;
  }

  private currentKeyboardInput(): LogicalMoveInput | null {
    const key = this.heldMovementKeys[this.heldMovementKeys.length - 1];
    return key ? (KEY_INPUT[key] ?? null) : null;
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (
      !this.enabled ||
      !this.capabilities.pointer ||
      (!this.capabilities.movement && !this.capabilities.pan && !this.capabilities.zoom)
    )
      return;
    if (event.pointerType === "mouse" && event.button !== 0 && event.button !== 1) return;

    const panPointer = event.pointerType === "mouse" && event.button === 1;
    const discreteMovePointer = !panPointer && this.capabilities.movement;
    if (!panPointer && !discreteMovePointer && !this.capabilities.zoom) return;

    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      discreteMoveIssued: false,
      panPointer,
    });
    if (this.capabilities.zoom && this.pointers.size === 2) {
      this.pinchStartDistance = this.pointerDistance();
      this.pinchStartZoom = this.game.zoom;
      for (const pointer of this.pointers.values()) pointer.discreteMoveIssued = true;
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
        this.pinchStartZoom * (this.pointerDistance() / this.pinchStartDistance),
      );
      return;
    }

    if (
      pointer.panPointer &&
      this.capabilities.pan &&
      this.pointers.size === 1 &&
      (dx !== 0 || dy !== 0)
    ) {
      this.game.panByScreen(dx, dy);
      return;
    }

    if (
      !pointer.panPointer &&
      !pointer.discreteMoveIssued &&
      this.capabilities.movement &&
      this.pointers.size === 1
    ) {
      const direction = directionForDiscreteDrag(
        pointer.x - pointer.startX,
        pointer.y - pointer.startY,
      );
      if (direction) {
        pointer.discreteMoveIssued = true;
        pointer.moved = true;
        this.discreteMoves.push({ source: "pointer", direction });
      }
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const pointer = this.pointers.get(event.pointerId);
    const wasPinching = this.pointers.size >= 2;
    this.pointers.delete(event.pointerId);
    const mayProduceClick = event.pointerType !== "mouse" || event.button === 0;
    if (mayProduceClick && (pointer?.moved || wasPinching)) this.suppressNextClick = true;
    if (this.pointers.size < 2) this.pinchStartDistance = 0;
    for (const remaining of this.pointers.values()) {
      remaining.startX = remaining.x;
      remaining.startY = remaining.y;
      remaining.moved = false;
      remaining.discreteMoveIssued = true;
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.enabled || !this.capabilities.pointer || !this.capabilities.zoom) return;
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
