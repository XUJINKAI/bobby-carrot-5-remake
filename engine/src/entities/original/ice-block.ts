import { MapEntityTypeId } from "@bobby/model";
import type {
  RuntimeActionDefinition,
  RuntimeActionSpec,
} from "../../world/action/RuntimeAction.js";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  boundedInt,
  tileAnimationCell,
  tileCell,
  originalModule,
} from "./module.js";

const ICE_MELT_ACTION = "ice-block-melt";
const ORIGINAL_GAMEPLAY_STEP_MS = 31;
export const ICE_MELT_STAGE_MS = 6 * ORIGINAL_GAMEPLAY_STEP_MS;

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.ICE_BLOCK,
  presenceFacts: ["blocking", "contact-cover", "vertical-occupant"],
  state: [
    {
      key: "meltStage",
      kind: "enum",
      label: "融化阶段",
      default: 0,
      options: [0, 1, 2, 3].map((value) => ({ value })),
    },
  ],
  presentation: { name: "Ice Block" },
};

const base = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const stage = boundedInt(context.entity.state?.meltStage, 0, 3, 0);
    return stage === 0
      ? tileCell(MapEntityTypeId.ICE_BLOCK)
      : tileAnimationCell(MapEntityTypeId.ICE_BLOCK, "melt", stage);
  }),
);

const iceMeltAction: RuntimeActionDefinition = {
  kind: ICE_MELT_ACTION,
  update({ action, time, query, commands }) {
    const entityId = action.ownerEntityId;
    if (entityId === undefined) return "complete";
    const ice = query.entity(entityId);
    if (ice?.type !== MapEntityTypeId.ICE_BLOCK) return "complete";

    let stage = boundedInt(ice.state?.meltStage, 0, 3, 0);
    if (stage === 0) return "complete";
    let elapsedMs = numberState(action.state.elapsedMs) + time.stepMs;
    while (elapsedMs >= ICE_MELT_STAGE_MS) {
      elapsedMs = Math.max(0, elapsedMs - ICE_MELT_STAGE_MS);
      if (stage === 3) {
        commands.destroy(ice.id);
        commands.emit({
          type: "ice-melted",
          entityId: ice.id,
          x: ice.anchor.x,
          y: ice.anchor.y,
        });
        return "complete";
      }
      stage += 1;
    }
    action.state.elapsedMs = elapsedMs;
    if (stage !== ice.state?.meltStage)
      commands.setState(ice.id, { ...ice.state, meltStage: stage });
    return "running";
  },
};

export const iceBlock: EntityModule = {
  ...base,
  runtimeActions: [iceMeltAction],
};

/** 火球命中 Ice Block 后，由对象领域提出融化命令。 */
export function meltIceBlocksAt(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  cell: { x: number; y: number },
): void {
  for (const presence of query.presencesAt(cell)) {
    const entity = query.entity(presence.entityId);
    if (entity?.type !== MapEntityTypeId.ICE_BLOCK) continue;
    if (boundedInt(entity.state?.meltStage, 0, 3, 0) !== 0) continue;
    commands.setState(entity.id, { ...entity.state, meltStage: 1 });
    commands.startAction(createIceMeltAction(entity.id));
    commands.emit({
      type: "ice-melting-started",
      entityId: entity.id,
      x: cell.x,
      y: cell.y,
    });
  }
}

function createIceMeltAction(entityId: number): RuntimeActionSpec {
  return {
    kind: ICE_MELT_ACTION,
    ownerEntityId: entityId,
    state: { elapsedMs: 0 },
  };
}

function numberState(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
