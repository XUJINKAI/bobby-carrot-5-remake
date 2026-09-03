export type ShellIcon = "back" | "edit" | "erase" | "fill" | "help" | "info" | "inspector" | "menu" | "music" | "palette" | "place" | "play" | "redo" | "restart" | "select" | "settings" | "share" | "stop" | "undo";

export interface ShellMenuItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface ShellIdentity {
  icon: string;
  productName?: string;
  contextName?: string;
  productNameVisible?: boolean;
  contextNameVisible?: boolean;
  href?: string;
  menu?: ShellMenuItem[];
}

export interface ShellAction {
  id: string;
  label?: string;
  icon?: ShellIcon;
  title?: string;
  href?: string;
  collapse?: "keep" | "overflow" | "hide";
  disabled?: boolean;
  pressed?: boolean;
  separatorBefore?: boolean;
  badge?: { label: string; title?: string; className?: string };
}

export interface ShellInfo {
  text: string;
  href?: string;
}

export interface ShellConfig {
  topBar?: {
    visible?: boolean;
    fixed?: boolean;
    identity?: ShellIdentity;
    back?: ShellAction;
    commands?: ShellAction[];
    actions?: ShellAction[];
  };
  bottomBar?: {
    visible?: boolean;
    fixed?: boolean;
    leading?: ShellAction[];
    info?: ShellInfo[];
    trailing?: ShellAction[];
  };
}

export interface HelpDescriptor {
  title: string;
  sections: Array<{ title?: string; lines: string[] }>;
}

export interface ShellViewState {
  config: ShellConfig;
  help: HelpDescriptor;
}

export interface ShellBridge {
  apply(config: ShellConfig, help: HelpDescriptor): void;
}

const SCREEN_CONTROL_STORAGE_KEY = "bc5r:screen-control";
let activeBridge: ShellBridge | null = null;

export function installShellBridge(bridge: ShellBridge | null): void {
  activeBridge = bridge;
}

export function configureShell(
  config: ShellConfig,
  help: HelpDescriptor = defaultHelpDescriptor(),
): void {
  if (!activeBridge) throw new Error("Web Shell 尚未挂载");
  activeBridge.apply(config, help);
}

export function defaultHelpDescriptor(): HelpDescriptor {
  return {
    title: "操作帮助",
    sections: [{ lines: ["WASD / 方向键：移动", "拖动画面：查看地图"] }],
  };
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
