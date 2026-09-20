import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  tileCell,
  originalModule,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.COLOR_SWITCH,
  presenceFacts: ["walkable"],
  state: [
    {
      key: "color",
      kind: "enum",
      label: "颜色",
      default: "yellow",
      options: [{ value: "yellow" }, { value: "pink" }],
    },
    {
      key: "state",
      kind: "enum",
      label: "状态",
      default: "state-1",
      options: [{ value: "state-1" }, { value: "state-2" }],
    },
  ],
  presentation: { name: "Color Switch" },
};

const colorSwitchBehavior: Behavior = {
  id: "color-switch-global-toggle",
  onEnter({ actor, self, query, commands }) {
    if (!query.entityHasFact(actor.id, "player")) return;

    const color = self.entity.state?.color === "pink" ? "pink" : "yellow";
    for (const entity of query.entitiesMatching({
      kind: "type",
      value: MapEntityTypeId.COLOR_SWITCH,
    })) {
      if (
        entity.type !== MapEntityTypeId.COLOR_SWITCH ||
        entity.state?.color !== color
      )
        continue;
      commands.setState(entity.id, {
        ...entity.state,
        state: entity.state?.state === "state-2" ? "state-1" : "state-2",
      });
    }

    for (const entity of query.entitiesMatching({
      kind: "type",
      value: MapEntityTypeId.COLOR_BLOCK,
    })) {
      if (
        entity.type !== MapEntityTypeId.COLOR_BLOCK ||
        entity.state?.color !== color
      )
        continue;
      commands.setState(entity.id, {
        ...entity.state,
        // 未显式保存 raised 时遵循 Definition 默认值，第一次翻转应落下。
        raised: entity.state?.raised === false,
      });
    }
  },
};

export const colorSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const color = context.entity.state?.color === "pink" ? "pink" : "yellow";
    const state = context.entity.state?.state === "state-2"
      ? "state-2"
      : "state-1";
    return tileCell(MapEntityTypeId.COLOR_SWITCH, {
      fields: { color, state },
    });
  }),
  [{ behavior: colorSwitchBehavior }],
);
