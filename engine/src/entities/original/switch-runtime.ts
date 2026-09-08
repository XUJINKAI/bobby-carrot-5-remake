import {
  EntityTypeId,
  MapEntityTypeId,
  type Direction,
  type EntityType,
  type JsonValue,
} from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";

export const colorSwitchBehavior: Behavior = {
  id: "color-switch-global-toggle",
  onEnter({ actor, self, query, commands }) {
    if (!query.entityHasTrait(actor.id, "player")) return;

    const color = self.entity.state?.color === "pink" ? "pink" : "yellow";
    for (const entity of query.entitiesWithTrait("switch")) {
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

    for (const entity of query.entitiesWithTrait("stateful-block")) {
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

function directionalSwitchBehavior(
  id: string,
  switchType: EntityType,
  targetType: EntityType,
): Behavior {
  return {
    id,
    onEnter({ actor, self, query, commands }) {
      if (!query.entityHasTrait(actor.id, "player")) return;
      // 原版只有 Raised 状态会启动整图变换；Pressed 状态再次进入不触发。
      if (self.entity.state?.pressed === true) return;

      for (const entity of query.entitiesWithTrait("switch")) {
        if (entity.type !== switchType) continue;
        commands.setState(entity.id, {
          ...entity.state,
          pressed: entity.state?.pressed !== true,
        });
      }

      for (const entity of query.entitiesWithTrait("forced-movement")) {
        if (entity.type !== targetType) continue;
        commands.setDirection(
          entity.id,
          oppositeDirection(entity.direction ?? "right"),
        );
      }
    },
  };
}

export const speedSwitchBehavior = directionalSwitchBehavior(
  "speed-switch-global-reverse",
  EntityTypeId.SPEED_SWITCH,
  EntityTypeId.SPEED,
);

export const tideSwitchBehavior = directionalSwitchBehavior(
  "tide-switch-global-reverse",
  EntityTypeId.TIDE_SWITCH,
  EntityTypeId.TIDE,
);

export const carouselSwitchBehavior: Behavior = {
  id: "carousel-switch-global-rotate",
  onEnter({ actor, self, query, commands }) {
    if (!query.entityHasTrait(actor.id, "player")) return;
    if (self.entity.state?.pressed === true) return;

    for (const entity of query.entitiesWithTrait("switch")) {
      if (entity.type !== EntityTypeId.CAROUSEL_SWITCH) continue;
      commands.setState(entity.id, {
        ...entity.state,
        pressed: entity.state?.pressed !== true,
      });
    }

    for (const entity of query.entitiesWithTrait("carousel")) {
      if (entity.type !== EntityTypeId.CAROUSEL) continue;
      commands.setState(entity.id, {
        ...entity.state,
        variant: rotateCarouselVariant(entity.state?.variant),
      });
    }
  },
};

function oppositeDirection(direction: Direction): Direction {
  return {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  }[direction] as Direction;
}

function rotateCarouselVariant(value: JsonValue | undefined): JsonValue {
  if (value === "vertical") return "horizontal";
  if (value === "horizontal") return "vertical";
  if (value === 4) return 3;
  if (value === 3) return 2;
  if (value === 2) return 1;
  return 4;
}
