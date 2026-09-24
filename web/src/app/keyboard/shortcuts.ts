export interface WebShortcut {
  key: string;
  shift?: boolean;
  label: string;
}

/** 命令匹配和悬停提示共用同一份键位定义。 */
export const WEB_SHORTCUTS = {
  restart: { key: "r", shift: true, label: "Shift+R" },
  leftPanel: { key: "z", label: "Z" },
  rightPanel: { key: "x", label: "X" },
  music: { key: "m", label: "M" },
  help: { key: "?", label: "?" },
  random: { key: "s", shift: true, label: "Shift+S" },
  continue: { key: "p", label: "P" },
} satisfies Record<string, WebShortcut>;

export function matchesShortcut(event: KeyboardEvent, shortcut: WebShortcut): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  // 问号由键盘布局决定是否需要 Shift，直接匹配最终字符。
  if (shortcut.key !== "?" && event.shiftKey !== (shortcut.shift ?? false)) return false;
  return event.key.toLowerCase() === shortcut.key;
}

export function shortcutTitle(title: string, shortcut?: string): string {
  return shortcut ? `${title} (${shortcut})` : title;
}
