import type { AppIconName } from "../shared/icons/types.js";

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
  contextNameVisible?: boolean;
  href?: string;
  menu?: ShellMenuItem[];
}

export interface ShellAction {
  id: string;
  label?: string;
  icon?: ShellIcon;
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
  const suffix = warnings.length > 1 ? ` · 共 ${warnings.length} 个警告` : "";
  return {
    ...config,
    bottomBar: {
      ...bottomBar,
      info: [...info, { text: `${first}${suffix}`, icon: "warning" }],
    },
  };
}

export function unifiedHelpDescriptor(): HelpDescriptor {
  return {
    title: "操作说明",
    sections: [
      {
        title: "游戏",
        lines: [
          "WASD / 方向键：控制移动",
          "Ctrl+Z：撤销（自由探索）",
          "Ctrl+Y：重做（自由探索）",
          "+ / -：缩放地图",
          "滚轮：缩放地图",
          "按住滚轮拖动：平移地图",
          "Tab：切换录制面板（自由探索）",
          "~：切换 Debug（自由探索）",
        ],
      },
      {
        title: "Editor",
        lines: [
          "Tab：切换 Palette / Surface",
          "1：选择",
          "2：画笔",
          "3：Surface 智能填充",
          "4：Palette 删除工具",
          "Ctrl+A：全选地图",
          "Ctrl+Z：撤销",
          "Ctrl+Y：重做",
          "Ctrl+C / X / V：复制 / 剪切 / 粘贴",
          "Delete / Backspace：删除选中的 Entity",
          "Q / E：切换 Palette Entity 形态",
          "右键：切换选择工具并选择当前格",
          "滚轮：缩放地图",
          "按住滚轮拖动：平移地图",
          "双指：缩放地图",
        ],
      },
    ],
  };
}
