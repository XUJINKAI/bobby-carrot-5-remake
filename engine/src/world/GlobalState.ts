/** 非空间、非 actor-local 的 gameplay 状态。 */
export interface GlobalState {
  moves: number;
  elapsedMs: number;
  /** 为宿主交互请求分配可随 Snapshot 恢复的确定性序号。 */
  nextInteractionRequestId: number;
  /** 已提交的目标交互；目标 Entity 消费后仍可由 Goal 查询。 */
  successfulGoalInteractions: string[];
}

export function createGlobalState(): GlobalState {
  return {
    moves: 0,
    elapsedMs: 0,
    nextInteractionRequestId: 1,
    successfulGoalInteractions: [],
  };
}
