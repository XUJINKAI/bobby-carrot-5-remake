export type AppMode = "home" | "adventure" | "explore" | "editor" | "custom";

export interface ShellContextAction {
  id?: string;
  label: string;
  title?: string;
  className?: string;
  placement?: "leading" | "center" | "trailing";
  badge?: {
    label: string;
    title?: string;
    className?: string;
  } | undefined;
}

export interface ShellOptions {
  title?: string;
  content: string;
  mode?: AppMode;
  contextActions?: ShellContextAction[];
  contextInfo?: string;
  showBottomBar?: boolean;
  showScreenControlToggle?: boolean;
  topBarFixed?: boolean;
  bottomBarFixed?: boolean;
}

export interface ShellViewState {
  mode: AppMode;
  contextActions: ShellContextAction[];
  contextInfo: string;
  showBottomBar: boolean;
  showScreenControlToggle: boolean;
  topBarFixed: boolean;
  bottomBarFixed: boolean;
}

export interface ShellBridge {
  apply(options: ShellOptions): void;
}

const SCREEN_CONTROL_STORAGE_KEY = "bc5r:screen-control";
let activeBridge: ShellBridge | null = null;

/** Vue 根应用安装唯一 Shell bridge，页面适配器只提交内容和上下文状态。 */
export function installShellBridge(bridge: ShellBridge | null): void {
  activeBridge = bridge;
}

/** App Shell 由 Vue 渲染；返回值只进入 Vue 提供的页面容器。 */
export function renderAppShell(options: ShellOptions): string {
  if (!activeBridge) throw new Error("Vue App Shell 尚未挂载");
  activeBridge.apply(options);
  return options.content;
}

export function loadScreenControlPreference(): boolean {
  const stored = localStorage.getItem(SCREEN_CONTROL_STORAGE_KEY);
  if (stored !== null) return stored === "true";
  return window.matchMedia("(pointer: coarse)").matches;
}

export function storeScreenControlPreference(enabled: boolean): void {
  localStorage.setItem(SCREEN_CONTROL_STORAGE_KEY, String(enabled));
  window.dispatchEvent(
    new CustomEvent("screen-control-change", { detail: { enabled } }),
  );
}
