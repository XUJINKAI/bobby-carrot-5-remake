import { EntityTypeId, type JsonValue } from "@bobby/model";
import type { Behavior, MovementContext } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  boundedInt,
  cell,
  originalModule,
  SURFACE_STACK_ORDER,
  variantState,
} from "./module.js";

type CarouselVariant = 1 | 2 | 3 | 4 | "vertical" | "horizontal";

const carouselPassage: Behavior = {
  id: "carousel-passage",
  canEnter({ self, movement }) {
    if (!movement) return;
    return passageResult(carouselVariant(self.entity.state?.variant), movement, true);
  },
  canLeave({ self, movement }) {
    if (!movement) return;
    return passageResult(carouselVariant(self.entity.state?.variant), movement, false);
  },
  onLeave({ actor, self, query, commands }) {
    if (!query.entityHasTrait(actor.id, "player")) return;
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
  state: variantState([1, 2, 3, 4, "vertical", "horizontal"]),
  presentation: { name: "Carousel" },
};

export const carousel: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    const variant = context.entity.state?.variant ?? 1;
    if (variant === "vertical") return cell(13, 11);
    if (variant === "horizontal") return cell(14, 11);
    return cell(8 + boundedInt(variant, 1, 4, 1), 11);
  }),
  [{ behavior: carouselPassage }],
);

function carouselVariant(value: JsonValue | undefined): CarouselVariant {
  if (value === "vertical" || value === "horizontal") return value;
  const variant = boundedInt(value, 1, 4, 1);
  return variant as 1 | 2 | 3 | 4;
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
    if (variant === 1) passable = dx === -1 || dy === 1;
    else if (variant === 2) passable = dx === 1 || dy === 1;
    else if (variant === 3) passable = dx === 1 || dy === -1;
    else passable = dx === -1 || dy === -1;
  } else {
    if (variant === 1) passable = dx === 1 || dy === -1;
    else if (variant === 2) passable = dx === -1 || dy === -1;
    else if (variant === 3) passable = dx === -1 || dy === 1;
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
  return ({ 1: 4, 4: 3, 3: 2, 2: 1 } as const)[variant];
}
