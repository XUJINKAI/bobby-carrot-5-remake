import type { LevelLimit, LevelMap, WinCondition } from "@bobby/model";
import type { GlobalState } from "./GlobalState.js";
import type { WorldQueryApi } from "./behavior/WorldQueryApi.js";
import type { ReachResolver } from "./outcome/ReachResolver.js";
import type { GoalRegistry } from "./outcome/GoalRegistry.js";
import type { SpatialIndex } from "./spatial/SpatialIndex.js";
import type { WinConditionState } from "./WorldTypes.js";
import type { WorldMetricsMechanism } from "./outcome/WorldMetrics.js";

/** 地图目标、限制和派生计数的集中求值器。 */
export class WorldRuleEvaluator {
  constructor(
    private readonly rules: LevelMap["rules"],
    private readonly spatial: SpatialIndex,
    private readonly query: WorldQueryApi,
    private readonly reach: ReachResolver,
    private readonly goals: GoalRegistry,
    private readonly metrics: WorldMetricsMechanism,
    private readonly state: () => GlobalState,
  ) {}

  get winState(): WinConditionState | null {
    const condition = this.rules?.win;
    return condition ? this.evaluateWin(condition) : null;
  }

  refreshDerivedState(): void {
    const state = this.state();
    state.metrics = { ...this.metrics.project(this.spatial) };
  }

  completionReady(motionRunning: boolean): boolean {
    const state = this.state();
    if (state.completed || state.dead || motionRunning) return false;
    const win = this.winState;
    return win?.completed === true;
  }

  exceededLimitReason(): string | null {
    const state = this.state();
    if (state.completed || state.dead) return null;
    for (const limit of this.rules?.limits ?? []) {
      if (!this.limitExceeded(limit)) continue;
      return (
        limit.type === "max-moves"
          ? `Move limit exceeded: ${limit.moves}`
          : `Time limit exceeded: ${limit.seconds}s`
      );
    }
    return null;
  }

  private limitExceeded(limit: LevelLimit): boolean {
    const state = this.state();
    if (limit.type === "max-moves") return state.moves > limit.moves;
    return state.elapsedMs > limit.seconds * 1000;
  }

  private evaluateWin(condition: WinCondition): WinConditionState {
    switch (condition.type) {
      case "all": {
        const conditions = condition.conditions.map((item) =>
          this.evaluateWin(item),
        );
        return {
          type: "all",
          completed: conditions.every((item) => item.completed),
          conditions,
        };
      }
      case "any": {
        const conditions = condition.conditions.map((item) =>
          this.evaluateWin(item),
        );
        return {
          type: "any",
          completed: conditions.some((item) => item.completed),
          conditions,
        };
      }
      default: {
        const result = this.goals.require(condition.type).evaluate({
          query: this.query,
          reach: this.reach,
          successfulGoalInteractions: this.state().successfulGoalInteractions,
        });
        return { type: condition.type, ...result };
      }
    }
  }
}
