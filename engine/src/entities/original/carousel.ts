import { EntityTypeId, type JsonValue } from "@bobby/model";
import type { Behavior, MovementContext } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { bobbyMountId } from "../player/BobbyState.js";
import {
  atlasVisual,
  namedCell,
  originalModule,
  SURFACE_STACK_ORDER,
  variantState,
} from "./module.js";

type CarouselVariant =
  | "right-top"
  | "left-top"
  | "left-bottom"
  | "right-bottom"
  | "vertical"
  | "horizontal";

const carouselPassage: Behavior = {
  id: "carousel-passage",
  canEnter({ actor, self, movement }) {
    if (!movement) return;
    if (bobbyMountId(actor.state) !== null)
      return { passable: false, reason: "mounted-actor-cannot-use-carousel" };
    return passageResult(carouselVariant(self.entity.state?.variant), movement, true);
  },
  canLeave({ actor, self, movement }) {
    if (!movement) return;
    if (bobbyMountId(actor.state) !== null)
      return { passable: false, reason: "mounted-actor-cannot-use-carousel" };
    return passageResult(carouselVariant(self.entity.state?.variant), movement, false);
  },
  onLeave({ actor, self, query, commands }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null
    )
      return;
    commands.setState(self.entity.id, {
      ...self.entity.state,
      variant: rotateCarousel(carouselVariant(self.entity.state?.variant)),
    });
  },
};

const definition: EntityModuleDefinition = {
  type: EntityTypeId.CAROUSEL,
  traits: ["walkable", "carousel", "directional-passage", "rotatable"],
  stackOrder: SURFACE_STACK_ORDER,
  state: variantState([
    "right-top",
    "left-top",
    "left-bottom",
    "right-bottom",
    "vertical",
    "horizontal",
  ]),
  presentation: { name: "Carousel" },
};

export const carousel: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const variant = carouselVariant(context.entity.state?.variant);
    return namedCell(`carousel-${variant}`);
  }),
  [{ behavior: carouselPassage }],
);

function carouselVariant(value: JsonValue | undefined): CarouselVariant {
  if (
    value === "right-top" ||
    value === "left-top" ||
    value === "left-bottom" ||
    value === "right-bottom" ||
    value === "vertical" ||
    value === "horizontal"
  )
    return value;
  return "right-top";
}

function passageResult(
  variant: CarouselVariant,
  movement: MovementContext,
  entering: boolean,
) {
  const dx = movement.to.x - movement.from.x;
  const dy = movement.to.y - movement.from.y;
  let passable = true;

  if (variant === "horizontal") passable = dx !== 0;
  else if (variant === "vertical") passable = dy !== 0;
  else if (entering) {
    if (variant === "right-top") passable = dx === -1 || dy === 1;
    else if (variant === "left-top") passable = dx === 1 || dy === 1;
    else if (variant === "left-bottom") passable = dx === 1 || dy === -1;
    else passable = dx === -1 || dy === -1;
  } else {
    if (variant === "right-top") passable = dx === 1 || dy === -1;
    else if (variant === "left-top") passable = dx === -1 || dy === -1;
    else if (variant === "left-bottom") passable = dx === -1 || dy === 1;
    else passable = dx === 1 || dy === 1;
  }

  return {
    passable,
    reason: passable ? "carousel-passage" : "carousel-direction-blocked",
  };
}

function rotateCarousel(variant: CarouselVariant): CarouselVariant {
  if (variant === "vertical") return "horizontal";
  if (variant === "horizontal") return "vertical";
  return {
    "right-top": "right-bottom",
    "right-bottom": "left-bottom",
    "left-bottom": "left-top",
    "left-top": "right-top",
  }[variant] as CarouselVariant;
}
