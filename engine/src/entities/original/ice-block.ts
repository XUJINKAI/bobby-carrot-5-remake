import { MapEntityTypeId } from "@bobby/model";
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

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.ICE_BLOCK,
  presenceFacts: ["blocking", "contact-cover"],
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

export const iceBlock: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const stage = boundedInt(context.entity.state?.meltStage, 0, 3, 0);
    return stage === 0
      ? tileCell(MapEntityTypeId.ICE_BLOCK)
      : tileAnimationCell(MapEntityTypeId.ICE_BLOCK, "melt", stage);
  }),
);

/** 火球命中 Ice Block 后，由对象领域提出融化命令。 */
export function meltIceBlocksAt(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  cell: { x: number; y: number },
): void {
  for (const presence of query.presencesAt(cell)) {
    const entity = query.entity(presence.entityId);
    if (entity?.type !== MapEntityTypeId.ICE_BLOCK) continue;
    commands.destroy(entity.id);
    commands.emit({
      type: "ice-melted",
      entityId: entity.id,
      x: cell.x,
      y: cell.y,
    });
  }
}
