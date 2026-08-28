export type EmbedKeyboardMode = false | "focus" | "global";
export type EmbedJoystickMode = boolean | "auto";
export type EmbedMusicStyle = "modern" | "8bit";

export interface BC5RMountOptions {
  target: string | HTMLElement;
  map?: string;
  mapUrl?: string;
  lang?: string;
  theme?: string;
  audio?: boolean | number;
  musicStyle?: EmbedMusicStyle;
  input?: {
    keyboard?: EmbedKeyboardMode;
    joystick?: EmbedJoystickMode;
  };
  camera?: {
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    pinchZoom?: boolean;
    wheelZoom?: boolean;
  };
  info?: string;
}

export interface BC5RHandle {
  readonly ready: Promise<void>;
  destroy(): void;
}
