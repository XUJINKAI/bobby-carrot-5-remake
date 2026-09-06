import { EntityTypeId, type Direction, type JsonValue } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  activeState,
  atlasVisual,
  cell,
  originalModule,
  SURFACE_STACK_ORDER,
} from "./module.js";

export const WIND_CHANNELS = ["yellow", "red", "blue", "purple"] as const;
export type WindChannel = (typeof WIND_CHANNELS)[number];

const WIND_DIRECTION_BY_CHANNEL: Readonly<Record<WindChannel, Direction>> = {
  yellow: "up",
  red: "down",
  blue: "left",
  purple: "right",
};

export function readWindChannel(value: JsonValue | undefined): WindChannel | null {
  return typeof value === "string" && WIND_CHANNELS.includes(value as WindChannel)
    ? (value as WindChannel)
    : null;
}

export function windDirectionForChannel(channel: WindChannel): Direction {
  return WIND_DIRECTION_BY_CHANNEL[channel];
}

const toggleWindChannel: Behavior = {
  id: "wind-switch-channel-toggle",
  onEnter({ actor, self, query, commands }) {
    if (!query.entityHasTrait(actor.id, "player")) return;
    const channel = readWindChannel(self.entity.state?.channel);
    if (!channel) return;
    const active = self.entity.state?.active !== true;

    for (const entity of query.entitiesWithTrait("switch")) {
      if (entity.type !== EntityTypeId.WIND_SWITCH) continue;
      if (readWindChannel(entity.state?.channel) !== channel) continue;
      commands.setState(entity.id, {
        ...entity.state,
        active,
      });
    }
  },
};

const definition: EntityModuleDefinition = {
  type: EntityTypeId.WIND_SWITCH,
  traits: ["walkable", "switch"],
  stackOrder: SURFACE_STACK_ORDER,
  properties: [
    {
      key: "channel",
      kind: "enum",
      label: "频道",
      default: "yellow",
      options: WIND_CHANNELS.map((value) => ({ value })),
    },
  ],
  state: activeState(false),
  presentation: { name: "Wind Switch" },
};

export const windSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const channel = readWindChannel(context.entity.state?.channel) ?? "yellow";
    const channelIndex = WIND_CHANNELS.indexOf(channel);
    const active = context.entity.state?.active === true;
    return cell(7 + channelIndex * 2 + (active ? 0 : 1), 10);
  }),
  [{ behavior: toggleWindChannel }],
);
