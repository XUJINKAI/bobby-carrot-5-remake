import type { GameplaySession } from "../core/GameplaySession.js";
import type { CellPosition, EntityId } from "../world/entity/EntityInstance.js";
import type {
  ActorEffectIntent,
  WorldIntent,
  WorldIntentGroup,
} from "../world/movement/WorldIntent.js";
import type {
  ReplayGameplayIntent,
  ReplayInitialIntent,
  ReplayInputGroup,
} from "./ReplayFormat.js";

/** Replay 的稳定引用只在执行边界解析成当前 World 的临时 entity ID。 */
export function resolveReplayInitialIntents(
  session: GameplaySession,
  intents: readonly ReplayInitialIntent[],
): ActorEffectIntent[] {
  return intents.map((intent) => resolveActorEffectIntent(session, intent));
}

export function resolveReplayInputGroups(
  session: GameplaySession,
  groups: readonly ReplayInputGroup[],
): WorldIntentGroup[] {
  return groups.map((group) => ({
    historyBoundary: true,
    intents: group.intents.flatMap((intent) =>
      resolveGameplayIntent(session, intent),
    ),
  }));
}

function resolveGameplayIntent(
  session: GameplaySession,
  intent: ReplayGameplayIntent,
): WorldIntent[] {
  if (intent.type !== "move")
    return [resolveActorEffectIntent(session, intent)];
  if (intent.actor) {
    return [{
      type: "move",
      actorId: resolveActorId(session, intent.actor),
      direction: intent.direction,
      cause: {
        type: "player-input",
        source: "replay",
        inputDirection: intent.direction,
      },
    }];
  }
  const channel = intent.channel ?? 0;
  const group = session.resolveControllerInput(
    channel,
    intent.direction,
    "replay",
  );
  if (group.intents.length === 0)
    throw new Error(`Replay controller channel ${channel} 没有 Bobby`);
  return [...group.intents];
}

function resolveActorEffectIntent(
  session: GameplaySession,
  intent: ReplayInitialIntent,
): ActorEffectIntent {
  const actorId = intent.actor
    ? resolveActorId(session, intent.actor)
    : onlyActorId(session);
  if (intent.type === "set-actor-lock-key") {
    return {
      type: intent.type,
      actorId,
      kind: intent.kind,
      enabled: intent.enabled,
    };
  }
  return {
    type: intent.type,
    actorId,
    moveDurationMs: intent.moveDurationMs,
  };
}

function onlyActorId(session: GameplaySession): EntityId {
  if (session.actorIds.length !== 1)
    throw new Error("多 Bobby 地图的 Replay actor 动作必须指定位置");
  return session.actorIds[0]!;
}

function resolveActorId(
  session: GameplaySession,
  position: Readonly<CellPosition>,
): EntityId {
  const matches = session.actorIds.filter((actorId) => {
    const actor = session.world.entity(actorId);
    return actor?.anchor.x === position.x && actor.anchor.y === position.y;
  });
  if (matches.length !== 1)
    throw new Error(
      `Replay actor 位置 (${position.x}, ${position.y}) 无法唯一定位 Bobby`,
    );
  return matches[0]!;
}
