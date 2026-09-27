import type { Locale } from "@bobby/i18n";

export interface ShareImage {
  readonly path: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

export function shareImage(path: string, locale?: Locale): ShareImage;
