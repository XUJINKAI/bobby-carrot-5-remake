/** 非空间、非 actor-local 的 gameplay 状态。 */
export interface GlobalState {
  dead: boolean;
  completed: boolean;
  deathReason: string | null;
  moves: number;
  elapsedMs: number;
  metrics: Record<string, number>;
  /** 为宿主交互请求分配可随 Snapshot 恢复的确定性序号。 */
  nextInteractionRequestId: number;
  /** 本次成功移动进入格子的 selector 快照；允许 reach 匹配 onEnter 中被消费的实体。 */
  lastReachedSelectors: string[];
  warnings: string[];
  logicRemainderMs: number;
}

export function createGlobalState(): GlobalState {
  return {
    dead: false,
    completed: false,
    deathReason: null,
    moves: 0,
    elapsedMs: 0,
    metrics: {},
    nextInteractionRequestId: 1,
    lastReachedSelectors: [],
    warnings: [],
    logicRemainderMs: 0,
  };
}
