import type { Direction } from "@bobby/model";
import { resolveGameplayMount } from "../ui/gameplayMount.js";

export interface ScreenJoystickOptions {
  enabled?: boolean;
  root?: HTMLElement;
  opacity?: number;
  deadZone?: number;
  size?: number;
  activationWidth?: number;
  activationHeight?: number;
  activationInsetRight?: number;
  activationInsetBottom?: number;
  defaultInsetRight?: number;
  defaultInsetBottom?: number;
  initialRepeatDelayMs?: number;
}

export const DEFAULT_SCREEN_JOYSTICK_OPTIONS = {
  enabled: true,
  opacity: 0.45,
  deadZone: 0.2,
  size: 128,
  activationWidth: 180,
  activationHeight: 180,
  activationInsetRight: 0,
  activationInsetBottom: 0,
  defaultInsetRight: 28,
  defaultInsetBottom: 28,
  initialRepeatDelayMs: 375,
} as const;

export interface ScreenJoystickLayout {
  size: number;
  activationWidth: number;
  activationHeight: number;
  activationInsetRight: number;
  activationInsetBottom: number;
  defaultInsetRight: number;
  defaultInsetBottom: number;
  defaultBaseX: number;
  defaultBaseY: number;
}

export interface JoystickVectorState {
  direction: Direction | null;
  distance: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 解析屏幕摇杆几何参数；识别区与默认圆盘位置彼此独立。 */
export function resolveScreenJoystickLayout(
  options: ScreenJoystickOptions = {},
): ScreenJoystickLayout {
  const size = Math.max(
    72,
    options.size ?? DEFAULT_SCREEN_JOYSTICK_OPTIONS.size,
  );
  const activationWidth = Math.max(
    size,
    options.activationWidth ?? DEFAULT_SCREEN_JOYSTICK_OPTIONS.activationWidth,
  );
  const activationHeight = Math.max(
    size,
    options.activationHeight ?? DEFAULT_SCREEN_JOYSTICK_OPTIONS.activationHeight,
  );
  const activationInsetRight = Math.max(
    0,
    options.activationInsetRight ??
      DEFAULT_SCREEN_JOYSTICK_OPTIONS.activationInsetRight,
  );
  const activationInsetBottom = Math.max(
    0,
    options.activationInsetBottom ??
      DEFAULT_SCREEN_JOYSTICK_OPTIONS.activationInsetBottom,
  );
  const defaultInsetRight = Math.max(
    0,
    options.defaultInsetRight ?? DEFAULT_SCREEN_JOYSTICK_OPTIONS.defaultInsetRight,
  );
  const defaultInsetBottom = Math.max(
    0,
    options.defaultInsetBottom ??
      DEFAULT_SCREEN_JOYSTICK_OPTIONS.defaultInsetBottom,
  );
  const halfSize = size / 2;
  const defaultBaseX = clamp(
    activationWidth - defaultInsetRight - halfSize,
    halfSize,
    activationWidth - halfSize,
  );
  const defaultBaseY = clamp(
    activationHeight - defaultInsetBottom - halfSize,
    halfSize,
    activationHeight - halfSize,
  );

  return {
    size,
    activationWidth,
    activationHeight,
    activationInsetRight,
    activationInsetBottom,
    defaultInsetRight,
    defaultInsetBottom,
    defaultBaseX,
    defaultBaseY,
  };
}

export function directionForJoystickVector(
  dx: number,
  dy: number,
  deadZonePixels: number,
  previous: Direction | null = null,
): JoystickVectorState {
  const distance = Math.hypot(dx, dy);
  if (distance <= deadZonePixels) return { direction: null, distance };
  const horizontal = Math.abs(dx);
  const vertical = Math.abs(dy);
  const hysteresis = Math.max(4, deadZonePixels * 0.18);
  if (
    previous &&
    ((previous === "left" || previous === "right")
      ? horizontal + hysteresis >= vertical
      : vertical + hysteresis >= horizontal)
  ) {
    return { direction: previous, distance };
  }
  return {
    direction:
      horizontal > vertical
        ? dx < 0
          ? "left"
          : "right"
        : dy < 0
          ? "up"
          : "down",
    distance,
  };
}

export class ScreenJoystick {
  private readonly layer: HTMLDivElement;
  private readonly activationArea: HTMLDivElement;
  private readonly element: HTMLDivElement;
  private readonly knob: HTMLDivElement;
  private readonly layout: ScreenJoystickLayout;
  private readonly radius: number;
  private readonly deadZonePixels: number;
  private pointerId: number | null = null;
  private centerX = 0;
  private centerY = 0;
  private direction: Direction | null = null;
  private interactionEnabled = true;

  constructor(
    canvas: HTMLCanvasElement,
    options: ScreenJoystickOptions,
    private readonly onDirection: (direction: Direction | null) => void,
  ) {
    const root = resolveGameplayMount(canvas, options.root, "ScreenJoystick");
    this.layout = resolveScreenJoystickLayout(options);
    this.radius = this.layout.size * 0.34;
    this.deadZonePixels =
      this.radius *
      Math.min(
        0.8,
        Math.max(
          0.05,
          options.deadZone ?? DEFAULT_SCREEN_JOYSTICK_OPTIONS.deadZone,
        ),
      );

    // Visual layer covers the gameplay mount and clips floating controls at its
    // boundary. A joystick centered near the screen edge therefore cannot grow
    // the document scroll area, while the hit area remains independently sized.
    this.layer = document.createElement("div");
    this.layer.className = "engine-screen-joystick-layer";
    Object.assign(this.layer.style, {
      position: "absolute",
      inset: "0",
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: "7",
    });

    this.activationArea = document.createElement("div");
    this.activationArea.className = "engine-screen-joystick-activation";
    this.activationArea.setAttribute("role", "application");
    this.activationArea.setAttribute("aria-label", "屏幕摇杆识别区域");
    Object.assign(this.activationArea.style, {
      position: "absolute",
      right: `calc(env(safe-area-inset-right) + ${this.layout.activationInsetRight}px)`,
      bottom: `calc(env(safe-area-inset-bottom) + ${this.layout.activationInsetBottom}px)`,
      width: `${this.layout.activationWidth}px`,
      height: `${this.layout.activationHeight}px`,
      touchAction: "none",
      userSelect: "none",
      pointerEvents: "auto",
    });

    this.element = document.createElement("div");
    this.element.className = "engine-screen-joystick";
    Object.assign(this.element.style, {
      position: "absolute",
      width: `${this.layout.size}px`,
      height: `${this.layout.size}px`,
      border: "1px solid rgba(255,255,255,.34)",
      borderRadius: "50%",
      background: "rgba(8,20,14,.34)",
      boxShadow: "inset 0 0 24px rgba(255,255,255,.07)",
      opacity: String(
        Math.min(
          0.9,
          Math.max(
            0.2,
            options.opacity ?? DEFAULT_SCREEN_JOYSTICK_OPTIONS.opacity,
          ),
        ),
      ),
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
    });

    this.knob = document.createElement("div");
    this.knob.className = "engine-screen-joystick-knob";
    Object.assign(this.knob.style, {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: `${this.layout.size * 0.42}px`,
      height: `${this.layout.size * 0.42}px`,
      border: "1px solid rgba(255,255,255,.5)",
      borderRadius: "50%",
      background: "rgba(230,245,232,.5)",
      boxShadow: "0 5px 18px rgba(0,0,0,.35)",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
    });
    this.element.append(this.knob);
    this.layer.append(this.activationArea, this.element);
    root.append(this.layer);
    this.moveBaseToDefault();
    this.layer.hidden = !(
      options.enabled ?? DEFAULT_SCREEN_JOYSTICK_OPTIONS.enabled
    );
    this.activationArea.addEventListener("pointerdown", this.onPointerDown);
    this.activationArea.addEventListener("pointermove", this.onPointerMove);
    this.activationArea.addEventListener("pointerup", this.onPointerEnd);
    this.activationArea.addEventListener("pointercancel", this.onPointerEnd);
    this.activationArea.addEventListener(
      "lostpointercapture",
      this.onLostCapture,
    );
  }

  get enabled(): boolean {
    return !this.layer.hidden;
  }

  setEnabled(enabled: boolean): void {
    this.layer.hidden = !enabled;
    if (!enabled) this.reset();
  }

  setInteractionEnabled(enabled: boolean): void {
    this.interactionEnabled = enabled;
    if (!enabled) this.reset();
  }

  destroy(): void {
    this.reset();
    this.activationArea.removeEventListener("pointerdown", this.onPointerDown);
    this.activationArea.removeEventListener("pointermove", this.onPointerMove);
    this.activationArea.removeEventListener("pointerup", this.onPointerEnd);
    this.activationArea.removeEventListener("pointercancel", this.onPointerEnd);
    this.activationArea.removeEventListener(
      "lostpointercapture",
      this.onLostCapture,
    );
    this.layer.remove();
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.interactionEnabled || this.pointerId !== null) return;
    event.preventDefault();
    this.pointerId = event.pointerId;
    this.centerX = event.clientX;
    this.centerY = event.clientY;
    this.moveBaseToPointer(event.clientX, event.clientY);
    this.activationArea.setPointerCapture(event.pointerId);
    this.update(event.clientX, event.clientY);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    event.preventDefault();
    this.update(event.clientX, event.clientY);
  };

  private readonly onPointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    event.preventDefault();
    this.reset();
  };

  private readonly onLostCapture = (event: PointerEvent): void => {
    if (event.pointerId === this.pointerId) this.reset();
  };

  private moveBaseToPointer(clientX: number, clientY: number): void {
    const rect = this.layer.getBoundingClientRect();
    this.element.style.left = `${clientX - rect.left}px`;
    this.element.style.top = `${clientY - rect.top}px`;
  }

  private moveBaseToDefault(): void {
    const rightFromLayer =
      this.layout.activationInsetRight +
      this.layout.activationWidth -
      this.layout.defaultBaseX;
    const bottomFromLayer =
      this.layout.activationInsetBottom +
      this.layout.activationHeight -
      this.layout.defaultBaseY;
    this.element.style.left = `calc(100% - env(safe-area-inset-right) - ${rightFromLayer}px)`;
    this.element.style.top = `calc(100% - env(safe-area-inset-bottom) - ${bottomFromLayer}px)`;
  }

  private update(clientX: number, clientY: number): void {
    const dx = clientX - this.centerX;
    const dy = clientY - this.centerY;
    const state = directionForJoystickVector(
      dx,
      dy,
      this.deadZonePixels,
      this.direction,
    );
    const scale = state.distance > this.radius ? this.radius / state.distance : 1;
    this.knob.style.transform = `translate(calc(-50% + ${dx * scale}px), calc(-50% + ${dy * scale}px))`;
    if (state.direction === this.direction) return;
    this.direction = state.direction;
    this.onDirection(this.direction);
  }

  reset(): void {
    this.pointerId = null;
    this.centerX = 0;
    this.centerY = 0;
    this.direction = null;
    this.moveBaseToDefault();
    this.knob.style.transform = "translate(-50%, -50%)";
    this.onDirection(null);
  }
}
