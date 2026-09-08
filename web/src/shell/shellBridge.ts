export type ShellIcon =
  | "back"
  | "edit"
  | "erase"
  | "fill"
  | "help"
  | "info"
  | "inspector"
  | "joystick"
  | "menu"
  | "music"
  | "next-track"
  | "palette"
  | "place"
  | "play"
  | "previous-track"
  | "redo"
  | "restart"
  | "select"
  | "settings"
  | "share"
  | "stop"
  | "undo";

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
  external?: boolean;
  collapse?: "keep" | "overflow" | "hide";
  disabled?: boolean;
  pressed?: boolean;
  separatorBefore?: boolean;
  badge?: { label: string; title?: string; className?: string };
}

export interface ShellInfo {
  text: string;
  href?: string;
  external?: boolean;
}

export interface ShellConfig {
  topBar?: {
    visible?: boolean;
    fixed?: boolean;
    identity?: ShellIdentity;
    back?: ShellAction;
    leading?: ShellAction[];
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

let activeBridge: ShellBridge | null = null;
let activeConfig: ShellConfig | null = null;
let activeHelp: HelpDescriptor = defaultHelpDescriptor();
let runtimeWarnings: string[] = [];

export function installShellBridge(bridge: ShellBridge | null): void {
  activeBridge = bridge;
  if (bridge) return;
  activeConfig = null;
  activeHelp = defaultHelpDescriptor();
  runtimeWarnings = [];
}

export function configureShell(
  config: ShellConfig,
  help: HelpDescriptor = defaultHelpDescriptor(),
): void {
  if (!activeBridge) throw new Error("Web Shell 尚未挂载");
  activeConfig = config;
  activeHelp = help;
  activeBridge.apply(mergeShellRuntimeWarnings(config, runtimeWarnings), help);
}

/** Gameplay session 的可玩性警告由 Shell 统一叠加，页面不需要重复处理。 */
export function setShellRuntimeWarnings(warnings: readonly string[]): void {
  runtimeWarnings = [
    ...new Set(warnings.map((warning) => warning.trim()).filter(Boolean)),
  ];
  if (!activeBridge || !activeConfig) return;
  activeBridge.apply(
    mergeShellRuntimeWarnings(activeConfig, runtimeWarnings),
    activeHelp,
  );
}

export function mergeShellRuntimeWarnings(
  config: ShellConfig,
  warnings: readonly string[],
): ShellConfig {
  const bottomBar = config.bottomBar;
  if (!bottomBar || bottomBar.visible === false || warnings.length === 0)
    return config;
  const info = bottomBar.info ?? [];
  if (
    warnings.some((warning) =>
      info.some((item) => item.text.includes(warning)),
    )
  )
    return config;
  const first = warnings[0]!;
  const suffix = warnings.length > 1 ? ` · 共 ${warnings.length} 个警告` : "";
  return {
    ...config,
    bottomBar: {
      ...bottomBar,
      info: [...info, { text: `⚠ ${first}${suffix}` }],
    },
  };
}

export function defaultHelpDescriptor(): HelpDescriptor {
  return {
    title: "操作帮助",
    sections: [{ lines: ["WASD / 方向键：移动", "拖动画面：查看地图"] }],
  };
}
