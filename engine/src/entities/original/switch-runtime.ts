import {
  EntityTypeId,
  type Direction,
  type EntityType,
  type JsonValue,
} from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";

function colorSwitchBehavior(
  id: string,
  switchType: EntityType,
  blockType: EntityType,
): Behavior {
  return {
    id,
    onEnter({ actor, query, commands }) {
      if (!query.entityHasTrait(actor.id, "player")) return;

      for (const entity of query.entitiesWithTrait("switch")) {
        if (entity.type !== switchType) continue;
        commands.setState(entity.id, {
          ...entity.state,
          pressed: entity.state?.pressed !== true,
        });
      }

      for (const entity of query.entitiesWithTrait("stateful-block")) {
        if (entity.type !== blockType) continue;
        commands.setState(entity.id, {
          ...entity.state,
          // 未显式保存 state 时遵循 Definition 的 raised 默认值，第一次翻转应落下。
          raised: entity.state?.raised === false,
        });
      }
    },
  };
}

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

export const yellowColorSwitchBehavior = colorSwitchBehavior(
  "yellow-color-switch-global-toggle",
  EntityTypeId.COLOR_YELLOW_SWITCH,
  EntityTypeId.COLOR_YELLOW_BLOCK,
);

export const pinkColorSwitchBehavior = colorSwitchBehavior(
  "pink-color-switch-global-toggle",
  EntityTypeId.COLOR_PINK_SWITCH,
  EntityTypeId.COLOR_PINK_BLOCK,
);

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
