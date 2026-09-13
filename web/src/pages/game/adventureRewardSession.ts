import {
  collectAdventureLevelReward,
  createAdventureLevelRewards,
  settleAdventureLevelCompletion,
  type AdventureLevelRewardType,
  type AdventureLevelRewards,
  type AdventureSave,
} from "@bobby/adventure";
import type { WorldEvent } from "@bobby/engine";
import { MapEntityTypeId } from "@bobby/model";

/** Adventure 页面只暂存本局奖励；唯一持久化出口与关卡完成绑定。 */
export class AdventureRewardSession {
  private rewards: AdventureLevelRewards = createAdventureLevelRewards();

  record(event: Pick<WorldEvent, "type">): void {
    const type = rewardTypeForEvent(event.type);
    if (type) this.rewards = collectAdventureLevelReward(this.rewards, type);
  }

  discard(): void {
    this.rewards = createAdventureLevelRewards();
  }

  complete(save: AdventureSave, levelId: string): AdventureSave {
    const next = settleAdventureLevelCompletion(save, levelId, this.rewards);
    this.discard();
    return next;
  }
}

function rewardTypeForEvent(type: string): AdventureLevelRewardType | null {
  if (type === "collect-bonus-coin") return MapEntityTypeId.BONUS_COIN;
  if (type === "collect-golden-carrot") return MapEntityTypeId.GOLDEN_CARROT;
  return null;
}
