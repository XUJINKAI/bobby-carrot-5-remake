import type { ShellAction, ShellConfig } from "./shellBridge.js";

export function narrowBottomTrailingActions(
  config: ShellConfig,
): ShellAction[] {
  const topBar = config.topBar;
  return [
    ...(topBar?.leading ?? []),
    ...(topBar?.commands ?? []),
    ...(topBar?.actions ?? []),
  ].filter((action) => action.narrow?.placement === "bottom-trailing");
}
