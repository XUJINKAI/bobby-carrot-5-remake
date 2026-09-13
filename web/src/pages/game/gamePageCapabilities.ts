export type GamePageMode = "explore" | "adventure";

export interface GamePageCapabilities {
  debug: boolean;
  replayPanel: boolean;
}

/** Adventure 的验证工具只随开发服务器开放，正式构建保持玩家体验边界。 */
export function resolveGamePageCapabilities(
  mode: GamePageMode,
  development: boolean,
): GamePageCapabilities {
  const explore = mode === "explore";
  return {
    debug: explore || development,
    replayPanel: explore || development,
  };
}
