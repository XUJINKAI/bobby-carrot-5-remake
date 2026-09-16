import type { CommandQueue } from "../behavior/CommandQueue.js";
import type {
  EntityInstance,
  EntityState,
} from "../entity/EntityInstance.js";
import type { ActorEffectIntent } from "../movement/WorldIntent.js";

/** World 只调度 Actor 协议；具体对象解释自己的库存与移动状态。 */
export interface ActorPolicy {
  movementDurationMs(state: EntityState | undefined): number | null;
  applyEffect(
    intent: ActorEffectIntent,
    actor: Readonly<EntityInstance>,
    state: EntityState | undefined,
    commands: CommandQueue,
  ): EntityState | undefined;
}
