import type { AppIconName, AppIconWeight } from "../shared/icons/types.js";
import { webT } from "../i18n/webI18n.js";

export type ShellIcon = AppIconName;

export interface ShellMenuItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface ShellIdentity {
  icon: string;
  productName?: string;
  statusText?: string;
  contextName?: string;
  productNameVisible?: boolean;
  productNameVisibleOnNarrow?: boolean;
  contextNameVisible?: boolean;
  href?: string;
  menu?: ShellMenuItem[];
}

export interface ShellAction {
  id: string;
  label?: string;
  icon?: ShellIcon;
  iconWeight?: AppIconWeight;
  iconTone?: "danger";
  cornerIcon?: ShellIcon;
  title?: string;
  href?: string;
  external?: boolean;
  collapse?: "keep" | "overflow" | "hide";
  disabled?: boolean;
  pressed?: boolean;
  tip?: string;
  separatorBefore?: boolean;
  badge?: { label: string; title?: string; className?: string };
}

export interface ShellInfo {
  text: string;
  icon?: AppIconName;
  href?: string;
  external?: boolean;
}

export interface ShellIndicator {
  id: string;
  icon: AppIconName;
  label: string;
  tone?: "success" | "muted";
  details?: ShellIndicatorDetail[];
}

export interface ShellIndicatorDetail {
  id: string;
  label: string;
  text: string;
  kind?: "note";
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
    leadingIndicators?: ShellIndicator[];
    info?: ShellInfo[];
    trailing?: ShellAction[];
  };
}

export interface ShellViewState {
  config: ShellConfig;
}

export interface ShellBridge {
  apply(config: ShellConfig): void;
}

let activeBridge: ShellBridge | null = null;
let activeConfig: ShellConfig | null = null;
let runtimeWarnings: string[] = [];

export function installShellBridge(bridge: ShellBridge | null): void {
  activeBridge = bridge;
  if (bridge) return;
  activeConfig = null;
  runtimeWarnings = [];
}

export function configureShell(config: ShellConfig): void {
  if (!activeBridge) throw new Error("Web Shell 尚未挂载");
  activeConfig = config;
  activeBridge.apply(mergeShellRuntimeWarnings(config, runtimeWarnings));
}

/** Gameplay session 的可玩性警告由 Shell 统一叠加，页面不需要重复处理。 */
export function setShellRuntimeWarnings(warnings: readonly string[]): void {
  runtimeWarnings = [
    ...new Set(warnings.map((warning) => warning.trim()).filter(Boolean)),
  ];
  if (!activeBridge || !activeConfig) return;
  activeBridge.apply(mergeShellRuntimeWarnings(activeConfig, runtimeWarnings));
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
  const suffix = warnings.length > 1
    ? ` · ${webT("shell.warningCount", { count: warnings.length })}`
    : "";
  return {
    ...config,
    bottomBar: {
      ...bottomBar,
      info: [...info, { text: `${first}${suffix}`, icon: "warning" }],
    },
  };
}
