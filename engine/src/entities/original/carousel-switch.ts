import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { rotateCarouselVariant } from "./carousel.js";
import {
  atlasVisual,
  tileCell,
  originalModule,
  pressedState,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.CAROUSEL_SWITCH,
  presenceFacts: ["walkable"],
  state: pressedState,
  presentation: { name: "Carousel Switch" },
};

const carouselSwitchBehavior: Behavior = {
  id: "carousel-switch-global-rotate",
  onEnter({ actor, self, query, commands }) {
    if (!query.entityHasFact(actor.id, "player")) return;
    if (self.entity.state?.pressed === true) return;

    for (const entity of query.entitiesMatching({
      kind: "type",
      value: MapEntityTypeId.CAROUSEL_SWITCH,
    })) {
      if (entity.type !== MapEntityTypeId.CAROUSEL_SWITCH) continue;
      commands.setState(entity.id, {
        ...entity.state,
        pressed: entity.state?.pressed !== true,
      });
    }

    for (const entity of query.entitiesMatching({
      kind: "type",
      value: MapEntityTypeId.CAROUSEL,
    })) {
      if (entity.type !== MapEntityTypeId.CAROUSEL) continue;
      commands.setState(entity.id, {
        ...entity.state,
        variant: rotateCarouselVariant(entity.state?.variant),
      });
    }
  },
};

export const carouselSwitch: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    tileCell(MapEntityTypeId.CAROUSEL_SWITCH, {
      fields: { pressed: context.entity.state?.pressed === true },
    }),
  ),
  [{ behavior: carouselSwitchBehavior }],
);
