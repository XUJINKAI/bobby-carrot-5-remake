import type { Locale } from "@bobby/i18n";

export const HOME_ROUTES: readonly Readonly<{ path: string; locale: Locale }>[];
export function homeLocale(path: string): Locale | null;
export function homePath(locale: Locale): string;
