/** 关卡颜色字段支持的常用 CSS 颜色别名。 */
export const COLOR_HEX_ALIASES = Object.freeze({
  black: "#000000",
  white: "#ffffff",
  gray: "#808080",
  grey: "#808080",
  red: "#ff0000",
  orange: "#ffa500",
  yellow: "#ffff00",
  green: "#008000",
  cyan: "#00ffff",
  blue: "#0000ff",
  purple: "#800080",
  pink: "#ffc0cb",
} as const);

export type ColorAlias = keyof typeof COLOR_HEX_ALIASES;

/** 将 #rgb、#rrggbb 或受支持的颜色别名规范为小写六位色。 */
export function normalizeColorHex(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  const alias = COLOR_HEX_ALIASES[normalized as ColorAlias];
  if (alias) return alias;
  if (/^#[0-9a-f]{6}$/.test(normalized)) return normalized;
  if (!/^#[0-9a-f]{3}$/.test(normalized)) return null;
  return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
}
