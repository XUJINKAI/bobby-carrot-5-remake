import type { Locale } from "@bobby/i18n";

export type EmbedKeyboardMode = "focus" | "global";
export type EmbedJoystickMode = boolean | "auto";
export type EmbedMusicStyle = "modern" | "8bit";

export interface BC5RMountOptions {
  target: string | HTMLElement;
  map?: string;
  mapUrl?: string;
  lang?: Locale | "auto";
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
  info?: string;
}

export interface BC5RHandle {
  readonly ready: Promise<void>;
  destroy(): void;
}
