import type { Direction } from "@bobby/model";
import { resolveGameplayMount } from "../ui/gameplayMount.js";

export interface ScreenJoystickOptions {
  enabled?: boolean;
  root?: HTMLElement;
  opacity?: number;
  deadZone?: number;
  size?: number;
  activationSize?: number;
}

export interface JoystickVectorState {
  direction: Direction | null;
  distance: number;
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
  private readonly activationArea: HTMLDivElement;
  private readonly element: HTMLDivElement;
  private readonly knob: HTMLDivElement;
  private readonly size: number;
  private readonly activationSize: number;
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
    this.size = Math.max(72, options.size ?? 112);
    this.activationSize = Math.max(
      this.size,
      options.activationSize ?? this.size * 2.4,
    );
    this.radius = this.size * 0.34;
    this.deadZonePixels =
      this.radius * Math.min(0.8, Math.max(0.05, options.deadZone ?? 0.2));

    this.activationArea = document.createElement("div");
    this.activationArea.className = "engine-screen-joystick-activation";
    this.activationArea.setAttribute("role", "application");
    this.activationArea.setAttribute("aria-label", "屏幕摇杆识别区域");
    Object.assign(this.activationArea.style, {
      position: "absolute",
      right: `calc(max(16px, env(safe-area-inset-right)) + ${this.size / 2}px)`,
      bottom: `calc(max(16px, env(safe-area-inset-bottom)) + ${this.size / 2}px)`,
      width: `${this.activationSize}px`,
      height: `${this.activationSize}px`,
      touchAction: "none",
      userSelect: "none",
      zIndex: "7",
    });

    this.element = document.createElement("div");
    this.element.className = "engine-screen-joystick";
    Object.assign(this.element.style, {
      position: "absolute",
      left: `${this.activationSize}px`,
      top: `${this.activationSize}px`,
      width: `${this.size}px`,
      height: `${this.size}px`,
      border: "1px solid rgba(255,255,255,.34)",
      borderRadius: "50%",
      background: "rgba(8,20,14,.34)",
      boxShadow: "inset 0 0 24px rgba(255,255,255,.07)",
      opacity: String(Math.min(0.9, Math.max(0.2, options.opacity ?? 0.45))),
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
    });

    this.knob = document.createElement("div");
    this.knob.className = "engine-screen-joystick-knob";
    Object.assign(this.knob.style, {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: `${this.size * 0.42}px`,
      height: `${this.size * 0.42}px`,
      border: "1px solid rgba(255,255,255,.5)",
      borderRadius: "50%",
      background: "rgba(230,245,232,.5)",
      boxShadow: "0 5px 18px rgba(0,0,0,.35)",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
    });
    this.element.append(this.knob);
    this.activationArea.append(this.element);
    root.append(this.activationArea);
    this.activationArea.hidden = options.enabled === false;
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
    return !this.activationArea.hidden;
  }

  setEnabled(enabled: boolean): void {
    this.activationArea.hidden = !enabled;
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
    this.activationArea.remove();
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
    const rect = this.activationArea.getBoundingClientRect();
    this.element.style.left = `${clientX - rect.left}px`;
    this.element.style.top = `${clientY - rect.top}px`;
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
    this.element.style.left = `${this.activationSize}px`;
    this.element.style.top = `${this.activationSize}px`;
    this.knob.style.transform = "translate(-50%, -50%)";
    this.onDirection(null);
  }
}
