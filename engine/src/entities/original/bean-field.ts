import { EntityTypeId, type JsonValue } from "@bobby/model";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "../../world/action/RuntimeAction.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type { EntityId } from "../../world/entity/EntityInstance.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  bobbyMountId,
  patchBobbyInventory,
  readBobbyInventory,
} from "../player/BobbyState.js";
import {
  atlasVisual,
  CONTENT_STACK_ORDER,
  namedCell,
  originalModule,
} from "./module.js";

const BEAN_GROWTH_ACTION = "bean-growth";
const ORIGINAL_GAMEPLAY_STEP_MS = 31;

export const DEFAULT_BEAN_GROWTH_SEGMENT_MS =
  16 * ORIGINAL_GAMEPLAY_STEP_MS;

const plantBean: Behavior = {
  id: "plant-bean",
  onEnter({ actor, self, query, commands }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null
    )
      return;
    const inventory = readBobbyInventory(actor.state);
    if (inventory.beans <= 0) {
      commands.emit({
        type: "missing-item",
        entityId: actor.id,
        x: self.presence.cell.x,
        y: self.presence.cell.y,
        data: { item: "bean" },
      });
      return;
    }

    commands.setState(
      actor.id,
      patchBobbyInventory(actor.state, { beans: inventory.beans - 1 }),
    );
    commands.destroy(self.entity.id);
    commands.spawn({
      type: EntityTypeId.BEAN_SPROUT,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
    commands.startAction(
      createBeanGrowthAction(self.presence.cell.x, self.presence.cell.y),
    );
    commands.emit({
      type: "bean-growth-started",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
};

const beanGrowthAction: RuntimeActionDefinition = {
  kind: BEAN_GROWTH_ACTION,
  update({ action, time, query, commands }) {
    const x = integerState(action.state.x);
    const baseY = integerState(action.state.baseY);
    const height = Math.max(1, integerState(action.state.height));
    const elapsedMs = numberState(action.state.elapsedMs) + time.stepMs;
    action.state.elapsedMs = elapsedMs;
    if (elapsedMs + time.stepMs / 2 < DEFAULT_BEAN_GROWTH_SEGMENT_MS)
      return "running";

    const nextY = baseY - height;
    if (!canGrowInto(query, x, nextY)) {
      commands.emit({
        type: "bean-growth-completed",
        x,
        y: baseY,
        data: { height },
      });
      return "complete";
    }

    const oldTipY = nextY + 1;
    const oldTip = stalkTipAt(query, x, oldTipY);
    if (oldTip === null) return "complete";
    commands.destroy(oldTip);
    commands.spawn({
      type:
        height === 1
          ? EntityTypeId.BEANSTALK_BASE
          : EntityTypeId.BEANSTALK_MID,
      x,
      y: oldTipY,
    });
    commands.spawn({ type: EntityTypeId.BEANSTALK_TIP, x, y: nextY });
    commands.emit({
      type: "bean-growth-segment",
      x,
      y: nextY,
      data: { height: height + 1 },
    });
    action.state.height = height + 1;
    action.state.elapsedMs = Math.max(
      0,
      elapsedMs - DEFAULT_BEAN_GROWTH_SEGMENT_MS,
    );
    return "running";
  },
};

const definition: EntityModuleDefinition = {
  type: EntityTypeId.BEAN_FIELD,
  traits: [],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Bean Field" },
};

const base = originalModule(
  definition,
  atlasVisual(definition, namedCell("bean-field")),
  [{ behavior: plantBean }],
);

export const beanField: EntityModule = {
  ...base,
  runtimeActions: [beanGrowthAction],
};

function createBeanGrowthAction(x: number, baseY: number): RuntimeActionSpec {
  return {
    kind: BEAN_GROWTH_ACTION,
    state: { x, baseY, height: 1, elapsedMs: 0 },
  };
}

function canGrowInto(query: WorldQueryApi, x: number, y: number): boolean {
  const cell = { x, y };
  if (!query.inBounds(cell) || !query.hasTraitAt(cell, "bean-growth-space"))
    return false;
  return query.presencesAt(cell).every(
    (presence) =>
      presence.layer === "surface" ||
      presence.traits.includes("bean-growth-space"),
  );
}

function stalkTipAt(
  query: WorldQueryApi,
  x: number,
  y: number,
): EntityId | null {
  for (const presence of query.presencesAt({ x, y })) {
    const entity = query.entity(presence.entityId);
    if (
      entity?.type === EntityTypeId.BEAN_SPROUT ||
      entity?.type === EntityTypeId.BEANSTALK_TIP
    )
      return entity.id;
  }
  return null;
}

function numberState(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function integerState(value: JsonValue | undefined): number {
  return Math.max(0, Math.floor(numberState(value)));
}
