import type { LevelLimit, LevelMap, WinCondition } from "@bobby/model";
import type { GlobalState } from "./GlobalState.js";
import type { WorldQueryApi } from "./behavior/WorldQueryApi.js";
import type { EntityStore } from "./entity/EntityStore.js";
import type { ReachResolver } from "./outcome/ReachResolver.js";
import type { SpatialIndex } from "./spatial/SpatialIndex.js";
import type { WinConditionState } from "./WorldTypes.js";

/** 地图目标、限制和派生计数的集中求值器。 */
export class WorldRuleEvaluator {
  constructor(
    private readonly rules: LevelMap["rules"],
    private readonly entities: EntityStore,
    private readonly spatial: SpatialIndex,
    private readonly query: WorldQueryApi,
    private readonly reach: ReachResolver,
    private readonly state: () => GlobalState,
  ) {}

  get winState(): WinConditionState | null {
    const condition = this.rules?.win;
    return condition ? this.evaluateWin(condition) : null;
  }

  refreshDerivedState(): void {
    const state = this.state();
    state.goldenCarrotsInLevel =
      this.query.entitiesWithTrait("golden-carrot").length;
    state.bonusCoinsInLevel = this.query.entitiesWithTrait("bonus-coin").length;
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
      case "collect-all": {
        const remaining = this.matchingEntityCount(condition.target);
        return {
          type: "collect-all",
          target: condition.target,
          completed: remaining === 0,
          remaining,
        };
      }
      case "reach": {
        const state = this.state();
        const actors = this.query.entitiesWithTrait("player");
        return {
          type: "reach",
          target: condition.target,
          completed:
            actors.some((actor) =>
              this.reach.actorReaches(actor, condition.target),
            ) ||
            state.lastReachedSelectors.includes(condition.target),
        };
      }
      case "fill-all": {
        const targets = this.spatialCellsMatching(condition.target);
        const remaining = targets.filter(
          (cell) => !this.hasSelectorAt(cell, condition.filler),
        ).length;
        return {
          type: "fill-all",
          target: condition.target,
          filler: condition.filler,
          completed: targets.length > 0 && remaining === 0,
          remaining,
        };
      }
    }
  }

  private matchingEntityCount(selector: string): number {
    return this.entities
      .all()
      .filter(
        (entity) =>
          entity.type === selector ||
          this.query.entityHasTrait(entity.id, selector),
      ).length;
  }

  private hasSelectorAt(
    cell: { x: number; y: number },
    selector: string,
  ): boolean {
    return this.spatial.presencesAt(cell).some((presence) => {
      const entity = this.entities.require(presence.entityId);
      return entity.type === selector || presence.traits.includes(selector);
    });
  }

  private spatialCellsMatching(selector: string): { x: number; y: number }[] {
    const result = new Map<string, { x: number; y: number }>();
    for (const entity of this.entities.all()) {
      const typeMatches = entity.type === selector;
      for (const presence of this.spatial.presencesForEntity(entity.id)) {
        if (!typeMatches && !presence.traits.includes(selector)) continue;
        result.set(`${presence.cell.x},${presence.cell.y}`, presence.cell);
      }
    }
    return [...result.values()];
  }
}
