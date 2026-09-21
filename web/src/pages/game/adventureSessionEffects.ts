import type { AdventureSessionPlan } from "@bobby/adventure";
import type { GameplayEffectIntent } from "@bobby/engine";
import { MapEntityTypeId } from "@bobby/model";

interface AdventureSessionEffectGame {
  readonly state: { readonly primaryActorId: number | null };
  dispatchInteractionEffect(intent: GameplayEffectIntent): void;
  on(event: "level-loaded", listener: () => void): () => void;
}

/** 把 Adventure Session 计划中的开局背包投影为通用 Engine effect。 */
export function bindAdventureSessionEffects(
  game: AdventureSessionEffectGame,
  plan: AdventureSessionPlan | null,
): () => void {
  if (!plan || plan.initialLockKeys === 0) return () => {};
  const apply = (): void => {
    const actorId = game.state.primaryActorId;
    if (actorId === null) return;
    game.dispatchInteractionEffect({
      type: "add-actor-inventory-item",
      actorId,
      item: MapEntityTypeId.LOCK_KEY,
      count: plan.initialLockKeys,
    });
  };
  apply();
  return game.on("level-loaded", apply);
}
