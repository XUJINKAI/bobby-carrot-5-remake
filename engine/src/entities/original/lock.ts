import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import {
  bobbyMountId,
  patchBobbyInventory,
  readBobbyInventory,
} from "../player/BobbyState.js";
import {
  defineEntityModule,
  type EntityModule,
  type EntityModuleDefinition,
} from "../EntityModule.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";
import {
  atlasVisual,
  boundedInt,
  CONTENT_STACK_ORDER,
  tileCell,
  originalModule,
} from "./module.js";

const unlock: Behavior = {
  id: "lock",
  canEnter({ actor, self, query, commands }) {
    if (bobbyMountId(actor.state) !== null)
      return { passable: false, reason: "mounted-actor-cannot-unlock" };
    const requireKey = self.entity.state?.requireKey === true;
    const inventory = readBobbyInventory(actor.state);
    if (requireKey && inventory.lockKeys === 0)
      return { passable: false, reason: "lock-needs-key" };

    const seconds = boundedInt(
      self.entity.state?.deathCountdownSeconds,
      0,
      3600,
      0,
    );
    if (seconds > 0)
      commands.spawn({
        type: RuntimeEntityTypeId.TIMED_CHALLENGE,
        x: self.entity.anchor.x,
        y: self.entity.anchor.y,
        state: {
          opened: true,
          openedByActorId: actor.id,
          deathCountdownSeconds: seconds,
          deathCountdownRemainingMs: seconds * 1000,
        },
      });
    commands.destroy(self.entity.id);
    if (requireKey)
      commands.setState(
        actor.id,
        patchBobbyInventory(actor.state, {
          lockKeys: inventory.lockKeys - 1,
        }),
      );
    if (seconds > 0)
      commands.emit({
        type: "death-countdown-started",
        entityId: actor.id,
        data: { seconds },
      });
    return { passable: true, reason: "lock-unlocked" };
  },
};

const trackTimedChallenge: Behavior = {
  id: "track-timed-challenge",
  onTick({ self, time, commands }) {
    if (!time) return;
    const state = self.entity.state ?? {};
    const remaining = Number(state.deathCountdownRemainingMs ?? 0);
    if (!Number.isFinite(remaining) || remaining <= 0) return;
    const next = Math.max(0, remaining - time.stepMs);
    commands.setState(self.entity.id, {
      ...(self.entity.state ?? {}),
      deathCountdownRemainingMs: next,
    });
    if (next > 0) return;
    const openedByActorId = Number(state.openedByActorId);
    if (Number.isInteger(openedByActorId) && openedByActorId > 0)
      commands.downActor(openedByActorId, "death-countdown-expired");
    else commands.loseWorld("death-countdown-expired");
  },
};

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.LOCK,
  traits: ["blocking", "gate", "timed-challenge"],
  stackOrder: CONTENT_STACK_ORDER,
  properties: [
    {
      key: "requireKey",
      kind: "boolean",
      label: "需要钥匙",
      default: false,
    },
    {
      key: "deathCountdownSeconds",
      kind: "number",
      label: "死亡倒计时（秒）",
      default: 0,
    },
  ],
  presentation: { name: "Lock" },
};

export const lock: EntityModule = originalModule(
  definition,
  atlasVisual(definition, tileCell(MapEntityTypeId.LOCK)),
  [{ behavior: unlock }],
);

export const timedChallenge: EntityModule = defineEntityModule({
  definition: {
    type: RuntimeEntityTypeId.TIMED_CHALLENGE,
    traits: ["timed-challenge"],
    state: [
      { key: "opened", kind: "boolean", label: "已启动", default: true },
      {
        key: "deathCountdownSeconds",
        kind: "number",
        label: "倒计时总秒数",
        default: 0,
      },
      {
        key: "deathCountdownRemainingMs",
        kind: "number",
        label: "倒计时剩余毫秒",
        default: 0,
      },
      {
        key: "openedByActorId",
        kind: "number",
        label: "启动者",
        default: 0,
      },
    ],
    presentation: { name: "Timed Challenge" },
  },
  visual: {
    id: RuntimeEntityTypeId.TIMED_CHALLENGE,
    resolve: () => null,
  },
  behaviorBindings: [{ behavior: trackTimedChallenge }],
});
