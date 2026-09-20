export type EmbedKeyboardMode = "focus" | "global";
export type EmbedJoystickMode = boolean | "auto";
export type EmbedMusicStyle = "modern" | "8bit";

export interface EmbedHudOptions {
  timer?: boolean;
  steps?: boolean;
}

export interface BC5RMountOptions {
  target: string | HTMLElement;
  map?: string;
  mapUrl?: string;
  lang?: string;
  audio?: boolean | number;
  musicStyle?: EmbedMusicStyle;
  input?: {
    keyboard?: EmbedKeyboardMode;
    joystick?: EmbedJoystickMode;
    pointer?: boolean;
  };
  camera?: {
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    pinchZoom?: boolean;
    wheelZoom?: boolean;
  };
  hud?: EmbedHudOptions;
  info?: string;
}

export interface BC5RHandle {
  readonly ready: Promise<void>;
  destroy(): void;
}

export type BC5RMount = (options: BC5RMountOptions) => BC5RHandle;

export interface BC5RQueue {
  push(...options: BC5RMountOptions[]): number;
}

export interface BC5RGlobal {
  mount: BC5RMount;
  queue: BC5RQueue;
}
